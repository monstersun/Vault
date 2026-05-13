const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("StoryEthVault (UUPS + ERC4626)", function () {
  const initialOwnerStake = ethers.parseEther("0.001");

  async function deployFixture() {
    const [owner, alice, bob] = await ethers.getSigners();

    const WETH9 = await ethers.getContractFactory("WETH9");
    const weth = await WETH9.deploy();
    await weth.waitForDeployment();

    const Vault = await ethers.getContractFactory("StoryEthVault");
    const vault = await upgrades.deployProxy(Vault, [], {
      kind: "uups",
      initializer: false,
    });
    await vault.waitForDeployment();
    await vault.initialize(
      await weth.getAddress(),
      "Story Staked ETH Vault",
      "stETHv",
      owner.address,
    );

    return { owner, alice, bob, weth, vault };
  }

  it("supports depositEth and mints shares", async function () {
    const { alice, vault, weth } = await deployFixture();
    const amount = ethers.parseEther("1");
    const aliceEthBefore = await ethers.provider.getBalance(alice.address);
    console.log("The shares: ", await vault.previewDeposit(amount));
    const depositTx = await vault
      .connect(alice)
      .depositEth(alice.address, { value: amount });
    const depositReceipt = await depositTx.wait();
    const aliceEthAfter = await ethers.provider.getBalance(alice.address);
    // console.log(await vault.balanceOf(alice.address));
    // console.log(await weth.balanceOf(vault.getAddress()));
    // await expect(vault.connect(alice).depositEth(alice.address, { value: amount }))
    //   .to.emit(vault, "Deposit")
    //   .withArgs(await vault.getAddress(), alice.address, amount, amount);

    expect(await vault.balanceOf(alice.address)).to.equal(amount);
    expect(await weth.balanceOf(await vault.getAddress())).to.equal(amount);
    expect(
      aliceEthAfter + depositReceipt.gasUsed * depositReceipt.gasPrice,
    ).to.equal(aliceEthBefore - amount);
  });

  it("supports withdrawEth and burns shares", async function () {
    const { alice, vault } = await deployFixture();
    const amount = ethers.parseEther("1");

    await vault.connect(alice).depositEth(alice.address, { value: amount });

    const before = await ethers.provider.getBalance(alice.address);
    const tx = await vault.connect(alice).withdrawEth(amount, alice.address);
    const receipt = await tx.wait();

    const gasCost = receipt.gasUsed * receipt.gasPrice;
    const after = await ethers.provider.getBalance(alice.address);

    expect(after + gasCost - before).to.equal(amount);
    expect(await vault.balanceOf(alice.address)).to.equal(0n);
  });

  it("supports native ERC4626 deposit()", async function () {
    const { alice, vault, weth } = await deployFixture();
    const amount = ethers.parseEther("1");
    const aliceEthBefore = await ethers.provider.getBalance(alice.address);

    const wrapTx = await weth.connect(alice).deposit({ value: amount });
    const wrapReceipt = await wrapTx.wait();
    const approveTx = await weth
      .connect(alice)
      .approve(await vault.getAddress(), amount);
    const approveReceipt = await approveTx.wait();
    const depositTx = await vault.connect(alice).deposit(amount, alice.address);
    const depositReceipt = await depositTx.wait();
    const aliceEthAfter = await ethers.provider.getBalance(alice.address);

    const totalGasCost =
      wrapReceipt.gasUsed * wrapReceipt.gasPrice +
      approveReceipt.gasUsed * approveReceipt.gasPrice +
      depositReceipt.gasUsed * depositReceipt.gasPrice;

    expect(await vault.balanceOf(alice.address)).to.equal(amount);
    expect(await vault.totalAssets()).to.equal(amount);
    expect(await weth.balanceOf(await vault.getAddress())).to.equal(amount);
    expect(await weth.balanceOf(alice.address)).to.equal(0n);
    expect(aliceEthAfter + totalGasCost).to.equal(aliceEthBefore - amount);
  });

  it("supports native ERC4626 withdraw() after native deposit()", async function () {
    const { alice, vault, weth } = await deployFixture();
    const amount = ethers.parseEther("1");
    const aliceEthBefore = await ethers.provider.getBalance(alice.address);

    const wrapTx = await weth.connect(alice).deposit({ value: amount });
    const wrapReceipt = await wrapTx.wait();
    const approveTx = await weth
      .connect(alice)
      .approve(await vault.getAddress(), amount);
    const approveReceipt = await approveTx.wait();
    const depositTx = await vault.connect(alice).deposit(amount, alice.address);
    const depositReceipt = await depositTx.wait();
    const withdrawTx = await vault
      .connect(alice)
      .withdraw(amount, alice.address, alice.address);
    const withdrawReceipt = await withdrawTx.wait();
    const aliceEthAfter = await ethers.provider.getBalance(alice.address);

    const totalGasCost =
      wrapReceipt.gasUsed * wrapReceipt.gasPrice +
      approveReceipt.gasUsed * approveReceipt.gasPrice +
      depositReceipt.gasUsed * depositReceipt.gasPrice +
      withdrawReceipt.gasUsed * withdrawReceipt.gasPrice;

    expect(await vault.balanceOf(alice.address)).to.equal(0n);
    expect(await vault.totalAssets()).to.equal(0n);
    expect(await weth.balanceOf(await vault.getAddress())).to.equal(0n);
    expect(await weth.balanceOf(alice.address)).to.equal(amount);
    expect(aliceEthAfter + totalGasCost).to.equal(aliceEthBefore - amount);
  });

  it("allows alice to depositEth twice correctly", async function () {
    const { alice, vault, weth } = await deployFixture();
    const firstAmount = ethers.parseEther("0.4");
    const secondAmount = ethers.parseEther("0.6");
    const aliceEthBefore = await ethers.provider.getBalance(alice.address);

    const deposit1Tx = await vault
      .connect(alice)
      .depositEth(alice.address, { value: firstAmount });
    const deposit1Receipt = await deposit1Tx.wait();
    const deposit2Tx = await vault
      .connect(alice)
      .depositEth(alice.address, { value: secondAmount });
    const deposit2Receipt = await deposit2Tx.wait();
    const aliceEthAfter = await ethers.provider.getBalance(alice.address);

    expect(await vault.balanceOf(alice.address)).to.equal(
      firstAmount + secondAmount,
    );
    expect(await weth.balanceOf(await vault.getAddress())).to.equal(
      firstAmount + secondAmount,
    );
    expect(
      aliceEthAfter +
        deposit1Receipt.gasUsed * deposit1Receipt.gasPrice +
        deposit2Receipt.gasUsed * deposit2Receipt.gasPrice,
    ).to.equal(aliceEthBefore - firstAmount - secondAmount);
  });

  it("allows alice to deposit once and withdrawEth twice", async function () {
    const { alice, vault, weth } = await deployFixture();
    const amount = ethers.parseEther("1");
    const firstWithdraw = ethers.parseEther("0.4");
    const secondWithdraw = ethers.parseEther("0.6");

    const aliceEthBefore = await ethers.provider.getBalance(alice.address);
    const depositTx = await vault
      .connect(alice)
      .depositEth(alice.address, { value: amount });
    const depositReceipt = await depositTx.wait();
    const firstWithdrawTx = await vault
      .connect(alice)
      .withdrawEth(firstWithdraw, alice.address);
    const firstWithdrawReceipt = await firstWithdrawTx.wait();
    const secondWithdrawTx = await vault
      .connect(alice)
      .withdrawEth(secondWithdraw, alice.address);
    const secondWithdrawReceipt = await secondWithdrawTx.wait();
    const aliceEthAfter = await ethers.provider.getBalance(alice.address);

    const totalGasCost =
      depositReceipt.gasUsed * depositReceipt.gasPrice +
      firstWithdrawReceipt.gasUsed * firstWithdrawReceipt.gasPrice +
      secondWithdrawReceipt.gasUsed * secondWithdrawReceipt.gasPrice;

    expect(await vault.balanceOf(alice.address)).to.equal(0n);
    expect(await weth.balanceOf(await vault.getAddress())).to.equal(0n);
    expect(await weth.balanceOf(alice.address)).to.equal(0n);
    expect(aliceEthAfter + totalGasCost).to.equal(aliceEthBefore);
  });

  it("allows second deposit via native ERC4626 deposit()", async function () {
    const { alice, vault, weth } = await deployFixture();
    const firstAmount = ethers.parseEther("0.5");
    const secondAmount = ethers.parseEther("0.5");
    const aliceEthBefore = await ethers.provider.getBalance(alice.address);

    const depositEthTx = await vault
      .connect(alice)
      .depositEth(alice.address, { value: firstAmount });
    const depositEthReceipt = await depositEthTx.wait();

    const wrapTx = await weth.connect(alice).deposit({ value: secondAmount });
    const wrapReceipt = await wrapTx.wait();
    const approveTx = await weth
      .connect(alice)
      .approve(await vault.getAddress(), secondAmount);
    const approveReceipt = await approveTx.wait();
    const depositTx = await vault
      .connect(alice)
      .deposit(secondAmount, alice.address);
    const depositReceipt = await depositTx.wait();
    const aliceEthAfter = await ethers.provider.getBalance(alice.address);
    const totalGasCost =
      depositEthReceipt.gasUsed * depositEthReceipt.gasPrice +
      wrapReceipt.gasUsed * wrapReceipt.gasPrice +
      approveReceipt.gasUsed * approveReceipt.gasPrice +
      depositReceipt.gasUsed * depositReceipt.gasPrice;

    expect(await vault.balanceOf(alice.address)).to.equal(
      firstAmount + secondAmount,
    );
    expect(await weth.balanceOf(await vault.getAddress())).to.equal(
      firstAmount + secondAmount,
    );
    expect(await weth.balanceOf(alice.address)).to.equal(0n);
    expect(aliceEthAfter + totalGasCost).to.equal(
      aliceEthBefore - firstAmount - secondAmount,
    );
  });

  it("allows second withdraw via native ERC4626 withdraw()", async function () {
    const { alice, vault, weth } = await deployFixture();
    const firstDeposit = ethers.parseEther("0.4");
    const secondDeposit = ethers.parseEther("0.6");
    const aliceEthBefore = await ethers.provider.getBalance(alice.address);

    const deposit1Tx = await vault
      .connect(alice)
      .depositEth(alice.address, { value: firstDeposit });
    const deposit1Receipt = await deposit1Tx.wait();
    const deposit2Tx = await vault
      .connect(alice)
      .depositEth(alice.address, { value: secondDeposit });
    const deposit2Receipt = await deposit2Tx.wait();

    const withdrawEthTx = await vault
      .connect(alice)
      .withdrawEth(firstDeposit, alice.address);
    const withdrawEthReceipt = await withdrawEthTx.wait();
    const withdrawTx = await vault
      .connect(alice)
      .withdraw(secondDeposit, alice.address, alice.address);
    const withdrawReceipt = await withdrawTx.wait();
    const aliceEthAfter = await ethers.provider.getBalance(alice.address);
    const totalGasCost =
      deposit1Receipt.gasUsed * deposit1Receipt.gasPrice +
      deposit2Receipt.gasUsed * deposit2Receipt.gasPrice +
      withdrawEthReceipt.gasUsed * withdrawEthReceipt.gasPrice +
      withdrawReceipt.gasUsed * withdrawReceipt.gasPrice;

    expect(await vault.balanceOf(alice.address)).to.equal(0n);
    expect(await weth.balanceOf(await vault.getAddress())).to.equal(0n);
    expect(await weth.balanceOf(alice.address)).to.equal(secondDeposit);
    expect(aliceEthAfter + totalGasCost).to.equal(
      aliceEthBefore - secondDeposit,
    );
  });

  it("can upgrade with UUPS", async function () {
    const { owner, vault } = await deployFixture();

    const proxyAddress = await vault.getAddress();
    const implementationAddress =
      await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log("Proxy:", proxyAddress);
    console.log("Implementation:", implementationAddress);
  });

  it("tracks shares and assets correctly when alice and bob deposit in sequence", async function () {
    const { alice, bob, vault, weth } = await deployFixture();
    const aliceAmount = ethers.parseEther("1");
    const bobAmount = ethers.parseEther("3");
    const aliceEthBefore = await ethers.provider.getBalance(alice.address);
    const bobEthBefore = await ethers.provider.getBalance(bob.address);
    const aliceDepositTx = await vault
      .connect(alice)
      .depositEth(alice.address, { value: aliceAmount });
    const aliceDepositReceipt = await aliceDepositTx.wait();
    const bobWrapTx = await weth.connect(bob).deposit({ value: bobAmount });
    const bobWrapReceipt = await bobWrapTx.wait();
    const bobApproveTx = await weth
      .connect(bob)
      .approve(await vault.getAddress(), bobAmount);
    const bobApproveReceipt = await bobApproveTx.wait();
    const bobDepositTx = await vault
      .connect(bob)
      .deposit(bobAmount, bob.address);
    const bobDepositReceipt = await bobDepositTx.wait();
    const aliceEthAfter = await ethers.provider.getBalance(alice.address);
    const bobEthAfter = await ethers.provider.getBalance(bob.address);

    const aliceShares = await vault.balanceOf(alice.address);
    const bobShares = await vault.balanceOf(bob.address);

    expect(aliceShares).to.equal(aliceAmount);
    expect(bobShares).to.equal(bobAmount);
    expect(await vault.totalAssets()).to.equal(aliceAmount + bobAmount);
    expect(await vault.convertToAssets(aliceShares)).to.equal(aliceAmount);
    expect(await vault.convertToAssets(bobShares)).to.equal(bobAmount);
    expect(aliceEthBefore - aliceEthAfter).to.equal(
      aliceAmount + aliceDepositReceipt.gasUsed * aliceDepositReceipt.gasPrice,
    );
    expect(
      bobEthAfter +
        bobWrapReceipt.gasUsed * bobWrapReceipt.gasPrice +
        bobApproveReceipt.gasUsed * bobApproveReceipt.gasPrice +
        bobDepositReceipt.gasUsed * bobDepositReceipt.gasPrice,
    ).to.equal(bobEthBefore - bobAmount);
    expect(await weth.balanceOf(bob.address)).to.equal(0n);
  });

  it("distributes injected WETH rewards correctly for withdraw and redeem paths", async function () {
    // 这段代码有问题，写了个屁
    const { owner, alice, bob, vault, weth } = await deployFixture();
    const aliceAmount = ethers.parseEther("1");
    const bobAmount = ethers.parseEther("1");
    const rewardAmount = ethers.parseEther("1");
    // 拿到了alice 和 bob的eth余额
    const aliceEthBefore = await ethers.provider.getBalance(alice.address);
    const bobEthBefore = await ethers.provider.getBalance(bob.address);

    // alice 和 bob deposits
    const aliceDepositTx = await vault
      .connect(alice)
      .depositEth(alice.address, { value: aliceAmount });
    const aliceDepositReceipt = await aliceDepositTx.wait();
    const bobWrapTx = await weth.connect(bob).deposit({ value: bobAmount });
    const bobWrapReceipt = await bobWrapTx.wait();
    const bobApproveTx = await weth
      .connect(bob)
      .approve(await vault.getAddress(), bobAmount);
    const bobApproveReceipt = await bobApproveTx.wait();
    const bobDepositTx = await vault
      .connect(bob)
      .deposit(bobAmount, bob.address);
    const bobDepositReceipt = await bobDepositTx.wait();

    // add rewards
    await weth.connect(owner).deposit({ value: rewardAmount });
    await weth.connect(owner).transfer(await vault.getAddress(), rewardAmount);

    // withdraw all shares make sure the tokens are corret
    // alice use the withdrawEth, calculate the eth balance after the exclude gases
    const aliceMaxWithdraw = await vault.maxWithdraw(alice.address);
    const aliceWithdrawTx = await vault
      .connect(alice)
      .withdrawEth(aliceMaxWithdraw, alice.address);
    const aliceWithdrawReceipt = await aliceWithdrawTx.wait();
    const alicegasUsed =
      aliceDepositReceipt.gasUsed * aliceDepositReceipt.gasPrice +
      aliceWithdrawReceipt.gasPrice * aliceWithdrawReceipt.gasUsed;
    const aliceEthAfterWithdraw = await ethers.provider.getBalance(
      alice.address,
    );
    const aliceBalanceExGas = aliceEthAfterWithdraw + alicegasUsed;
    console.log("The alice balance without gas", aliceBalanceExGas);

    console.log(
      "The alice profit:",
      (aliceBalanceExGas - aliceEthBefore) * 100n / aliceAmount,
    );

    // bob use the redeem routine
    const bobMaxRedeem = await await vault.balanceOf(bob.address);
    const bobRedeemTx = await vault.connect(bob).redeem(bobMaxRedeem, bob.address, bob.address);
    
    const bobWethAfter = await weth.balanceOf(bob.address);
    
    console.log('The bob profit:', (bobWethAfter - bobAmount) * 100n / bobAmount);
    console.log('The difference: ', (bobWethAfter - bobAmount) - (aliceBalanceExGas - aliceEthBefore));

    // 计算vault的仓位，并且使用console.log的方式打印
    const vaultPosition = await vault.totalSupply();
    console.log('Vault total shares:', vaultPosition.toString());

    // 打印vault的资产
    const vaultAssets = await vault.totalAssets();
    console.log('Vault total assets:', vaultAssets.toString());

    // eth账本是否守恒。
    // 初始：owner, alice, bob, vault 各自的ETH/WETH资产
    // reward为WETH注入vault
    // 计算所有参与者初始ETH+WETH余额之和与最终之和对比
    const ownerEth = await ethers.provider.getBalance(owner.address);
    const aliceEth = await ethers.provider.getBalance(alice.address);
    const bobEth = await ethers.provider.getBalance(bob.address);
    const vaultEth = await ethers.provider.getBalance(await vault.getAddress());
    const ownerWeth = await weth.balanceOf(owner.address);
    const aliceWeth = await weth.balanceOf(alice.address);
    const bobWeth = await weth.balanceOf(bob.address);
    const vaultWeth = await weth.balanceOf(await vault.getAddress());

    // ETH+WETH总和
    const totalEth = ownerEth + aliceEth + bobEth + vaultEth;
    const totalWeth = ownerWeth + aliceWeth + bobWeth + vaultWeth;

    console.log('Total ETH:', totalEth.toString());
    console.log('Total WETH:', totalWeth.toString());

    // Alice 再次 deposit
    const aliceSecondDeposit = ethers.parseEther("0.7");
    const aliceEthBeforeSecondDeposit = await ethers.provider.getBalance(alice.address);

    // 执行depositEth
    const aliceSecondDepositTx = await vault.connect(alice).depositEth(alice.address, { value: aliceSecondDeposit });
    const aliceSecondDepositReceipt = await aliceSecondDepositTx.wait();
    const aliceSharesAfterSecondDeposit = await vault.balanceOf(alice.address);

    // 打印Alice第二次deposit相关信息
    console.log("Alice second deposit amount:", aliceSecondDeposit.toString());
    console.log("Alice shares after second deposit:", aliceSharesAfterSecondDeposit.toString());

    // 检查deposit后状态
    // expect(aliceSharesAfterSecondDeposit).to.equal(aliceSecondDeposit); // Alice redeem完后应该是全部新份额

    // Alice 执行 withdraw
    // const aliceEthBeforeSecondWithdraw = await ethers.provider.getBalance(alice.address);
    const aliceMaxWithdrawVal = await vault.maxWithdraw(alice.address);
    console.log("Alice max withdraw after second deposit:", aliceMaxWithdrawVal.toString());
    expect(aliceMaxWithdrawVal).to.equal(aliceSecondDeposit);

    const aliceSecondWithdrawTx = await vault.connect(alice).withdrawEth(aliceSecondDeposit, alice.address);
    const aliceSecondWithdrawReceipt = await aliceSecondWithdrawTx.wait();

    // 检查withdraw后状态
    const aliceSharesAfterSecondWithdraw = await vault.balanceOf(alice.address);
    console.log("Alice shares after second withdraw:", aliceSharesAfterSecondWithdraw.toString());
    expect(aliceSharesAfterSecondWithdraw).to.equal(0n);

    // Alice获得的ETH应该等于本次deposit数量，差额为gas
    const aliceEthAfterSecondWithdraw = await ethers.provider.getBalance(alice.address);
    const totalGasCost2 =
      aliceSecondDepositReceipt.gasUsed * aliceSecondDepositReceipt.gasPrice +
      aliceSecondWithdrawReceipt.gasUsed * aliceSecondWithdrawReceipt.gasPrice;

    console.log("Alice ETH before second deposit:", aliceEthBeforeSecondDeposit.toString());
    console.log("Alice ETH after second withdraw:", aliceEthAfterSecondWithdraw.toString());
    console.log("Alice total gas (second round):", totalGasCost2.toString());
    console.log("Delta (should be ~0):", ((aliceEthAfterSecondWithdraw + totalGasCost2) - aliceEthBeforeSecondDeposit).toString());

    // alice总变化+gas ≈ 0
    expect((aliceEthAfterSecondWithdraw + totalGasCost2) - aliceEthBeforeSecondDeposit).to.equal(0n);

    // vault和weth合约的余额校验
    const vaultWethBalanceAfter = await weth.balanceOf(await vault.getAddress());
    const aliceWethBalanceAfter = await weth.balanceOf(alice.address);
    console.log("Vault WETH balance after all:", vaultWethBalanceAfter.toString());
    console.log("Alice WETH balance after all:", aliceWethBalanceAfter.toString());

    expect(await vault.balanceOf(alice.address)).to.equal(0n);
    expect(aliceWethBalanceAfter).to.equal(0n);

  });

  it("distributes injected WETH rewards correctly for withdrawEth path", async function () {
    const { owner, alice, bob, vault, weth } = await deployFixture();
    const aliceAmount = ethers.parseEther("1");
    const bobAmount = ethers.parseEther("1");
    const rewardAmount = ethers.parseEther("1");

    await weth.connect(alice).deposit({ value: aliceAmount });
    await weth.connect(alice).approve(await vault.getAddress(), aliceAmount);
    await vault.connect(alice).deposit(aliceAmount, alice.address);

    await vault.connect(bob).depositEth(bob.address, { value: bobAmount });

    await weth.connect(owner).deposit({ value: rewardAmount });
    await weth.connect(owner).transfer(await vault.getAddress(), rewardAmount);

    const aliceSharesBefore = await vault.balanceOf(alice.address);
    const aliceExpectedAssets = await vault.convertToAssets(aliceSharesBefore);
    const bobMaxWithdraw = await vault.maxWithdraw(bob.address);
    const alicePreviewAssets = await vault.previewRedeem(aliceSharesBefore);
    const aliceWethBefore = await weth.balanceOf(alice.address);
    const bobEthBefore = await ethers.provider.getBalance(bob.address);

    expect(aliceExpectedAssets).to.equal(alicePreviewAssets);
    expect(bobMaxWithdraw).to.equal(
      await vault.previewRedeem(await vault.balanceOf(bob.address)),
    );

    await vault
      .connect(alice)
      .redeem(aliceSharesBefore, alice.address, alice.address);
    const bobWithdrawTx = await vault
      .connect(bob)
      .withdrawEth(bobMaxWithdraw, bob.address);
    const bobWithdrawReceipt = await bobWithdrawTx.wait();
    const bobEthAfter = await ethers.provider.getBalance(bob.address);

    const remainingAssets = await vault.totalAssets();
    const remainingWeth = await weth.balanceOf(await vault.getAddress());
    expect(await vault.balanceOf(alice.address)).to.equal(0n);
    expect(await vault.balanceOf(bob.address)).to.equal(0n);
    expect(remainingAssets).to.equal(remainingWeth);
    expect(remainingAssets).to.be.lte(2n);
    expect((await weth.balanceOf(alice.address)) - aliceWethBefore).to.equal(
      alicePreviewAssets,
    );
    expect(
      bobEthAfter +
        bobWithdrawReceipt.gasUsed * bobWithdrawReceipt.gasPrice -
        bobEthBefore,
    ).to.equal(bobMaxWithdraw);
  });
});
