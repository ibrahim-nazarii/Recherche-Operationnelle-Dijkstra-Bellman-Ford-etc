'use client';

import React, { useState } from 'react';

type ExampleCategory = {
  title: string;
  questions: string[];
};

const ASK_EXAMPLE_CATEGORIES: ExampleCategory[] = [
  {
    title: 'Définitions juridiques',
    questions: [
      'Définis la force majeure en droit français et précise les conditions cumulatives requises, avec un arrêt de principe de la Cour de cassation.',
      'Quelle est la différence entre l’obligation de moyens et l’obligation de résultat ? Donne des exemples concrets et des références jurisprudentielles.',
    ],
  },
  {
    title: 'Questions juridiques générales',
    questions: [
      'Je suis locataire et le propriétaire refuse de restituer le dépôt de garantie plus de deux mois après l’état des lieux de sortie. Quels sont mes recours, quels délais s’appliquent et quelles sommes peuvent être réclamées ?',
      'Un client professionnel a payé une facture en retard. Puis-je réclamer des pénalités de retard et l’indemnité forfaitaire de recouvrement ? Quelles sont les conditions légales et comment effectuer le calcul ?',
    ],
  },
  {
    title: 'Procédure et prescription',
    questions: [
      'Comment fonctionne la mise en demeure ? Précise la forme, les modes de preuve, les effets juridiques, et propose un modèle de formulation.',
      'Quels sont les délais de prescription en responsabilité civile contractuelle et délictuelle ? Indique le point de départ du délai et les principales exceptions.',
    ],
  },
  {
    title: 'Analyse juridique (cas pratiques)',
    questions: [
      'Un contrat a été rompu unilatéralement sans préavis. Comment qualifier juridiquement la situation et quels fondements légaux peuvent être invoqués selon le type de contrat ?',
      'Un dommage est causé par un tiers non contractant. Comment déterminer s’il s’agit d’une responsabilité contractuelle ou délictuelle et quelles conséquences sur l’indemnisation ?',
    ],
  },
  {
    title: 'Sources et jurisprudence',
    questions: [
      'Identifie les bases légales et la jurisprudence pertinente applicables à un litige relatif au dépôt de garantie d’un bail d’habitation.',
      'Cite deux arrêts majeurs de la Cour de cassation illustrant la distinction entre obligation de moyens et obligation de résultat, et explique leur portée.',
    ],
  },
  {
    title: 'Délais, risques et stratégie',
    questions: [
      'Quels sont les risques juridiques liés au dépassement d’un délai de prescription ? Existe-t-il des causes d’interruption ou de suspension applicables ?',
      'Dans un litige commercial de faible montant, faut-il privilégier une solution amiable ou contentieuse ? Compare les coûts, délais et risques de chaque option.',
    ],
  },
  {
    title: 'Sécurité juridique et conformité',
    questions: [
      'Un client demande la suppression de ses données personnelles. Quelles sont les obligations issues du RGPD, les délais de réponse et les exceptions possibles ?',
    ],
  },
];

interface AskModeExamplesProps {
  onSelect: (question: string) => void;
  className?: string;
  showIntro?: boolean;
}

export function AskModeExamples({ onSelect, className, showIntro = true }: AskModeExamplesProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleCategories = showAll
    ? ASK_EXAMPLE_CATEGORIES
    : ASK_EXAMPLE_CATEGORIES.slice(0, 3);
  const hasHiddenCategories = ASK_EXAMPLE_CATEGORIES.length > 3;

  const containerClassName = [
    'text-text-muted text-sm pl-1 space-y-4',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClassName}>
      {showIntro && <div className="opacity-70">Exemples de questions :</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {visibleCategories.map((category) => (
          <div
            key={category.title}
            className="bg-card/60 border border-white/10 rounded-xl p-3 space-y-2"
          >
            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] uppercase tracking-wide bg-white/10 text-text-main">
              {category.title}
            </div>
            <div className="space-y-1.5">
              {category.questions.map((question) => (
                <button
                  key={question}
                  onClick={() => onSelect(question)}
                  className="group flex items-start gap-2 text-left text-text-muted hover:text-white transition-colors"
                >
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-text-muted/70 group-hover:bg-white/90" />
                  <span className="leading-snug">{question}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {hasHiddenCategories && (
        <button
          onClick={() => setShowAll((prev) => !prev)}
          className="text-xs uppercase tracking-wide text-primary hover:text-primary-hover transition-colors"
          aria-expanded={showAll}
        >
          {showAll ? 'Voir moins' : 'Voir plus'}
        </button>
      )}
    </div>
  );
}
