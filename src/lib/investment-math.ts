export function calcWithdrawal(
  invested: number,
  current: number,
  amountReceived: number
) {
  if (amountReceived <= 0) {
    return null;
  }

  const isFullExit = current <= 0.01 || amountReceived >= current - 0.01;

  if (isFullExit) {
    const costBasis = invested;
    const profitLoss = amountReceived - costBasis;
    return {
      costBasis,
      profitLoss,
      remainingCurrent: 0,
      remainingInvested: 0,
      isFullExit: true,
    };
  }

  const costBasis = current > 0 ? invested * (amountReceived / current) : invested;
  const profitLoss = amountReceived - costBasis;
  const remainingCurrent = current - amountReceived;
  const remainingInvested = Math.max(0, invested - costBasis);

  return {
    costBasis,
    profitLoss,
    remainingCurrent,
    remainingInvested,
    isFullExit: false,
  };
}
