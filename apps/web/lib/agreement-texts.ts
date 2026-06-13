/**
 * Resolves products.agreement (template key or inline text) to the text shown at checkout.
 */
const AGREEMENT_TEXT_BY_KEY: Record<string, string> = {
  "standard-uthyrning": `STANDARDAVTAL – MASKINUTHYRNING

1. Allmänna villkor
Hyresgästen förbinder sig att använda utrustningen enligt tillverkarens anvisningar och att återlämna den i samma skick som vid utlämning, med undantag för normalt slitage.

2. Ansvar och skador
Hyresgästen är ansvarig för skador som uppstår under hyresperioden. Skador som inte rapporteras vid återlämning kan debiteras hyresgästen. Vid förlust eller totalförstörelse gäller ersättning enligt nyvärde.

3. Återlämning
Utrustningen ska återlämnas senast kl. 12:00 på sista hyresdagen till angiven adress om inte annat avtalats. Sen återlämning debiteras med dubbel dygnsavgift per påbörjat dygn.

4. Betalning
Betalning sker enligt överenskommelse vid bokning. Vid försenad betalning utgår dröjsmålsränta enligt räntelagen.

5. Force majeure
Vid force majeure är hyresvärden befriad från ansvar för utebliven leverans eller återhämtning i den mån hindret inte kunnat undvikas.`,

  "bastu-uthyrning": `AVTAL – BASTU & EVENT (MOBIL BASTUVAGN)

1. Allmänna villkor
Hyresgästen ansvarar för att bastuvagnen hanteras säkert och endast används enligt instruktioner. Utrustningen får inte flyttas från avtalad plats utan skriftligt godkännande.

2. Utkörning och plats
Vid utkörning ska hyresgästen tillhandahålla tillgänglig och säker uppställningsplats. Hyresgästen ansvarar för eventuella tillstånd från markägare eller kommun.

3. Ansvar och skador
Hyresgästen är ansvarig för skador, förlust eller stöld under hyresperioden. Brandrisk och säkerhetsavstånd till brännbart material ska följas.

4. Återlämning
Bastuvagnen ska vara rengjord och tömd på vatten enligt instruktion vid återlämning. Sen återlämning debiteras enligt gällande prislista.

5. Betalning och avbokning
Betalning sker enligt bokning. Avbokningsvillkor framgår av bokningsbekräftelsen.`,
};

export function resolveAgreementText(agreementField: string): string {
  const trimmed = agreementField.trim();
  if (!trimmed) {
    return AGREEMENT_TEXT_BY_KEY["standard-uthyrning"] ?? "";
  }
  const byKey = AGREEMENT_TEXT_BY_KEY[trimmed];
  if (byKey) {
    return byKey;
  }
  return trimmed;
}
