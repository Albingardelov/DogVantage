import type { WeekPlan } from '@/types'

/**
 * Week 1 homecoming plan for new puppies (< 14 weeks).
 * No formal criteria — pure decompression, positive association, and very gentle exposure.
 * Adapts cat introduction exercises if cats are in the household.
 */
export function getHomecomeWeekPlan(hasCats: boolean): WeekPlan {
  return {
    days: [
      {
        // Day 1: pure decompression — explore home on own terms
        day: 'Måndag',
        rest: true,
      },
      {
        day: 'Tisdag',
        rest: false,
        exercises: [
          {
            id: 'socialisering',
            label: 'Hemkänsla',
            desc: hasCats
              ? 'Kattdoft på filt utan katt i rummet, 2 min'
              : 'Utforska ett rum i lugn takt, 2 min',
            reps: 1,
          },
          {
            id: 'hantering',
            label: 'Varsam hantering',
            desc: 'Mjuk klappning, lyft försiktigt med godis, 2 min',
            reps: 2,
          },
        ],
      },
      {
        day: 'Onsdag',
        rest: true,
      },
      {
        day: 'Torsdag',
        rest: false,
        exercises: [
          {
            id: 'namn',
            label: 'Namnkontakt',
            desc: 'Säg namn, ge godis vid ögonkontakt, 2 min',
            reps: 3,
          },
          {
            id: 'hantering',
            label: 'Varsam hantering',
            desc: 'Tassar, öron, mun — godis hela vägen, 2 min',
            reps: 2,
          },
        ],
      },
      {
        day: 'Fredag',
        rest: true,
      },
      {
        day: 'Lördag',
        rest: false,
        exercises: [
          {
            id: 'socialisering',
            label: 'Ljud & miljö',
            desc: 'Hushållsljud (dammsugare, TV) på avstånd, 3 min',
            reps: 1,
          },
          {
            id: 'namn',
            label: 'Namnkontakt ute',
            desc: 'Ute i trädgård eller balkong, glad röst, 2 min',
            reps: 3,
          },
        ],
      },
      {
        day: 'Söndag',
        rest: false,
        exercises: [
          {
            id: 'hantering',
            label: 'Varsam hantering',
            desc: 'Borste, klor, tänder lite i taget, 3 min',
            reps: 2,
          },
          ...(hasCats
            ? [{
                id: 'socialisering',
                label: 'Kattbekantskap',
                desc: 'Se katten genom gate/öppning, inget tryck, 2 min',
                reps: 1,
              }]
            : []),
        ],
      },
    ],
  }
}
