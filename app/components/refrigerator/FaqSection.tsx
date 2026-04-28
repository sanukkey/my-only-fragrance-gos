'use client';

import { useState } from 'react';
import { FaqItem } from '@/app/types/refrigerator';

interface Props {
  faqs: FaqItem[];
}

export function FaqSection({ faqs }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <dl className="space-y-2">
      {faqs.map((faq, i) => (
        <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
          <dt>
            <button
              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              aria-expanded={openIdx === i}
            >
              <span className="font-semibold text-sm text-gray-800">
                Q. {faq.question}
              </span>
              <span className="text-gray-400 flex-shrink-0 text-lg leading-none">
                {openIdx === i ? '−' : '+'}
              </span>
            </button>
          </dt>
          {openIdx === i && (
            <dd className="px-5 pb-4 pt-2 text-sm text-gray-600 leading-relaxed bg-gray-50 border-t border-gray-100">
              A. {faq.answer}
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
}
