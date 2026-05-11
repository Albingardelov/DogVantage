import type { WeekPlan } from '@/types'

/**
 * Week 1 homecoming plan for new puppies (< 14 weeks).
 * No formal criteria — pure decompression, positive association, and very gentle exposure.
 * Rastning and sleep are core every day (3-3-3 rule); only training-style exercises are gated.
 * Adapts cat introduction exercises if cats are in the household.
 */
export function getHomecomeWeekPlan(hasCats: boolean): WeekPlan {
  // Rastning + sömn-vila is default on every day — even decompression days.
  // Inserted as the first exercises on each day so they're never forgotten.
  const rastningEx = {
    id: 'rastning',
    label: 'Rastning',
    desc: 'Ut var 60 min vaken tid + efter sömn/mat/lek',
    reps: 8,
  }
  const sleepReminder = {
    id: 'ensam_traning',
    label: 'Vila i bur',
    desc: 'Valpen ska sova ~18 h/dygn — lägg in vila i bur mellan varje aktivitet, 1–2 h',
    reps: 4,
  }

  return {
    days: [
      {
        day: 'Måndag',
        rest: false,
        exercises: [rastningEx, sleepReminder],
      },
      {
        day: 'Tisdag',
        rest: false,
        exercises: [
          rastningEx,
          sleepReminder,
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
        rest: false,
        exercises: [rastningEx, sleepReminder],
      },
      {
        day: 'Torsdag',
        rest: false,
        exercises: [
          rastningEx,
          sleepReminder,
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
        rest: false,
        exercises: [rastningEx, sleepReminder],
      },
      {
        day: 'Lördag',
        rest: false,
        exercises: [
          rastningEx,
          sleepReminder,
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
          rastningEx,
          sleepReminder,
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
