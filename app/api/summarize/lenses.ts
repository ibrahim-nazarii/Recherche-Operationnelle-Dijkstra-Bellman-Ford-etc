export function fivePartSummaryMD(title: string, bullets: {facts:string[], issues:string[], reasoning:string[], holding:string[], cites:string[]}){
  const sec = (h:string, arr:string[]) => `### ${h}\n` + arr.map(x=>`- ${x}`).join('\n') + '\n\n';
  return `# ${title}\n\n` + sec('Faits', bullets.facts) + sec('Questions', bullets.issues) + sec('Raisonnement', bullets.reasoning) + sec('Dispositif', bullets.holding) + sec('Références clés', bullets.cites);
}
