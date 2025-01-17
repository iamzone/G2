import { G2Spec } from '../../../src';

export function aaplLineBasicLabelOverlapHide(): G2Spec {
  return {
    type: 'line',
    marginRight: 30,
    data: {
      type: 'fetch',
      value: 'data/aapl.csv',
    },
    encode: {
      x: 'date',
      y: 'close',
    },
    labels: [
      {
        text: 'close',
        transform: [
          {
            type: 'overlapHide',
          },
        ],
      },
    ],
  };
}

aaplLineBasicLabelOverlapHide.maxError = 100;
