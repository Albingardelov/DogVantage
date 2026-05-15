export interface BreedEntry {
  slug: string
  nameSv: string
  nameEn: string
  fciGroup: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  fciNumber: number
}

export const BREED_REGISTRY: BreedEntry[] = [
  // ── Grupp 1: Vall- och bokapshundar ─────────────────────────────────────
  { slug: 'australian_shepherd',        nameSv: 'Australisk vallhund',          nameEn: 'Australian Shepherd',              fciGroup: 1, fciNumber: 351 },
  { slug: 'australian_kelpie',          nameSv: 'Australisk kelpie',             nameEn: 'Australian Kelpie',                fciGroup: 1, fciNumber: 293 },
  { slug: 'belgian_malinois',           nameSv: 'Belgisk vallhund Malinois',     nameEn: 'Belgian Shepherd Malinois',        fciGroup: 1, fciNumber: 257 },
  { slug: 'belgian_tervuren',           nameSv: 'Belgisk vallhund Tervuren',     nameEn: 'Belgian Shepherd Tervuren',        fciGroup: 1, fciNumber: 257 },
  { slug: 'berger_australien',          nameSv: 'Berger Australien',             nameEn: 'Berger Australien',                fciGroup: 1, fciNumber: 337 },
  { slug: 'border_collie',              nameSv: 'Border Collie',                 nameEn: 'Border Collie',                    fciGroup: 1, fciNumber: 297 },
  { slug: 'bouvier_des_flandres',       nameSv: 'Bouvier des Flandres',          nameEn: 'Bouvier des Flandres',             fciGroup: 1, fciNumber: 191 },
  { slug: 'collie_rough',               nameSv: 'Collie (lång)',                 nameEn: 'Rough Collie',                     fciGroup: 1, fciNumber: 156 },
  { slug: 'collie_smooth',              nameSv: 'Collie (kort)',                 nameEn: 'Smooth Collie',                    fciGroup: 1, fciNumber: 296 },
  { slug: 'dutch_shepherd',             nameSv: 'Holländsk vallhund',            nameEn: 'Dutch Shepherd',                   fciGroup: 1, fciNumber: 223 },
  { slug: 'german_shepherd',            nameSv: 'Tysk schäfer',                  nameEn: 'German Shepherd Dog',              fciGroup: 1, fciNumber: 166 },
  { slug: 'miniature_american_shepherd', nameSv: 'Miniature American Shepherd', nameEn: 'Miniature American Shepherd',      fciGroup: 1, fciNumber: 357 },
  { slug: 'shetland_sheepdog',          nameSv: 'Shetland sheepdog',             nameEn: 'Shetland Sheepdog',                fciGroup: 1, fciNumber: 88 },
  { slug: 'welsh_corgi_cardigan',       nameSv: 'Cardigan Welsh Corgi',          nameEn: 'Cardigan Welsh Corgi',             fciGroup: 1, fciNumber: 38 },
  { slug: 'welsh_corgi_pembroke',       nameSv: 'Pembroke Welsh Corgi',          nameEn: 'Pembroke Welsh Corgi',             fciGroup: 1, fciNumber: 39 },
  // ── Grupp 2: Pinscher, Schnauzer, Molosser, Bergshundar ─────────────────
  { slug: 'bernese_mountain_dog',       nameSv: 'Berner sennenhund',             nameEn: 'Bernese Mountain Dog',             fciGroup: 2, fciNumber: 45 },
  { slug: 'boxer',                      nameSv: 'Boxer',                         nameEn: 'Boxer',                            fciGroup: 2, fciNumber: 144 },
  { slug: 'bullmastiff',                nameSv: 'Bullmastiff',                   nameEn: 'Bullmastiff',                      fciGroup: 2, fciNumber: 157 },
  { slug: 'cane_corso',                 nameSv: 'Cane Corso Italiano',           nameEn: 'Cane Corso',                       fciGroup: 2, fciNumber: 343 },
  { slug: 'dobermann',                  nameSv: 'Dobermann',                     nameEn: 'Dobermann',                        fciGroup: 2, fciNumber: 143 },
  { slug: 'great_dane',                 nameSv: 'Dansk-svensk gårdshund',        nameEn: 'Great Dane',                       fciGroup: 2, fciNumber: 235 },
  { slug: 'greater_swiss_mountain_dog', nameSv: 'Stor schweizisk sennenhund',    nameEn: 'Greater Swiss Mountain Dog',       fciGroup: 2, fciNumber: 58 },
  { slug: 'mastiff',                    nameSv: 'Mastiff',                       nameEn: 'Mastiff',                          fciGroup: 2, fciNumber: 264 },
  { slug: 'miniature_pinscher',         nameSv: 'Dvärg-pinscher',               nameEn: 'Miniature Pinscher',               fciGroup: 2, fciNumber: 185 },
  { slug: 'miniature_schnauzer',        nameSv: 'Dvärg-schnauzer',              nameEn: 'Miniature Schnauzer',              fciGroup: 2, fciNumber: 183 },
  { slug: 'newfoundland',               nameSv: 'Newfoundlandshund',             nameEn: 'Newfoundland',                     fciGroup: 2, fciNumber: 50 },
  { slug: 'pinscher',                   nameSv: 'Pinscher',                      nameEn: 'Pinscher',                         fciGroup: 2, fciNumber: 184 },
  { slug: 'rottweiler',                 nameSv: 'Rottweiler',                    nameEn: 'Rottweiler',                       fciGroup: 2, fciNumber: 147 },
  { slug: 'saint_bernard',              nameSv: 'Sankt Bernhardshund',           nameEn: 'Saint Bernard',                    fciGroup: 2, fciNumber: 61 },
  { slug: 'standard_schnauzer',         nameSv: 'Schnauzer',                     nameEn: 'Standard Schnauzer',               fciGroup: 2, fciNumber: 182 },
  // ── Grupp 3: Terrier ─────────────────────────────────────────────────────
  { slug: 'airedale_terrier',           nameSv: 'Airedaleterrier',               nameEn: 'Airedale Terrier',                 fciGroup: 3, fciNumber: 7 },
  { slug: 'bedlington_terrier',         nameSv: 'Bedlingtonterrier',             nameEn: 'Bedlington Terrier',               fciGroup: 3, fciNumber: 9 },
  { slug: 'border_terrier',             nameSv: 'Borderterrier',                 nameEn: 'Border Terrier',                   fciGroup: 3, fciNumber: 10 },
  { slug: 'bull_terrier',               nameSv: 'Bullterrier',                   nameEn: 'Bull Terrier',                     fciGroup: 3, fciNumber: 11 },
  { slug: 'cairn_terrier',              nameSv: 'Cairnterrier',                  nameEn: 'Cairn Terrier',                    fciGroup: 3, fciNumber: 4 },
  { slug: 'jack_russell_terrier',       nameSv: 'Jack Russell Terrier',          nameEn: 'Jack Russell Terrier',             fciGroup: 3, fciNumber: 345 },
  { slug: 'norfolk_terrier',            nameSv: 'Norfolkterrier',                nameEn: 'Norfolk Terrier',                  fciGroup: 3, fciNumber: 272 },
  { slug: 'norwich_terrier',            nameSv: 'Norwichterrier',                nameEn: 'Norwich Terrier',                  fciGroup: 3, fciNumber: 72 },
  { slug: 'parson_russell_terrier',     nameSv: 'Parson Russell Terrier',        nameEn: 'Parson Russell Terrier',           fciGroup: 3, fciNumber: 339 },
  { slug: 'scottish_terrier',           nameSv: 'Skotsk terrier',                nameEn: 'Scottish Terrier',                 fciGroup: 3, fciNumber: 73 },
  { slug: 'west_highland_white_terrier', nameSv: 'Västhighlandsterrier (Westie)', nameEn: 'West Highland White Terrier',    fciGroup: 3, fciNumber: 85 },
  // ── Grupp 4: Tax ─────────────────────────────────────────────────────────
  { slug: 'dachshund_standard',         nameSv: 'Tax (normalstorlek)',           nameEn: 'Dachshund (Standard)',             fciGroup: 4, fciNumber: 148 },
  { slug: 'dachshund_miniature',        nameSv: 'Dvärgtax',                     nameEn: 'Dachshund (Miniature)',            fciGroup: 4, fciNumber: 148 },
  { slug: 'dachshund_rabbit',           nameSv: 'Kanintax',                     nameEn: 'Dachshund (Rabbit)',               fciGroup: 4, fciNumber: 148 },
  // ── Grupp 5: Spetsar och urtyper ─────────────────────────────────────────
  { slug: 'akita',                      nameSv: 'Akita',                         nameEn: 'Akita',                            fciGroup: 5, fciNumber: 255 },
  { slug: 'alaskan_malamute',           nameSv: 'Alaskan Malamute',             nameEn: 'Alaskan Malamute',                 fciGroup: 5, fciNumber: 243 },
  { slug: 'chow_chow',                  nameSv: 'Chow Chow',                     nameEn: 'Chow Chow',                        fciGroup: 5, fciNumber: 205 },
  { slug: 'finnish_lapphund',           nameSv: 'Finsk lapphund',               nameEn: 'Finnish Lapphund',                 fciGroup: 5, fciNumber: 189 },
  { slug: 'icelandic_sheepdog',         nameSv: 'Islandshund',                   nameEn: 'Icelandic Sheepdog',               fciGroup: 5, fciNumber: 289 },
  { slug: 'norwegian_elkhound',         nameSv: 'Norsk älghund grå',            nameEn: 'Norwegian Elkhound Grey',          fciGroup: 5, fciNumber: 242 },
  { slug: 'pomeranian',                 nameSv: 'Pommeranian',                   nameEn: 'Pomeranian',                       fciGroup: 5, fciNumber: 97 },
  { slug: 'samoyed',                    nameSv: 'Samojed',                       nameEn: 'Samoyed',                          fciGroup: 5, fciNumber: 212 },
  { slug: 'shiba',                      nameSv: 'Shiba',                         nameEn: 'Shiba',                            fciGroup: 5, fciNumber: 257 },
  { slug: 'siberian_husky',             nameSv: 'Sibirisk husky',               nameEn: 'Siberian Husky',                   fciGroup: 5, fciNumber: 270 },
  { slug: 'swedish_lapphund',           nameSv: 'Svensk lapphund',              nameEn: 'Swedish Lapphund',                 fciGroup: 5, fciNumber: 135 },
  { slug: 'swedish_vallhund',           nameSv: 'Västgötaspets',                nameEn: 'Swedish Vallhund',                 fciGroup: 5, fciNumber: 14 },
  // ── Grupp 6: Drevhundar och eftersökshundar ───────────────────────────────
  { slug: 'basset_hound',               nameSv: 'Basset Hound',                  nameEn: 'Basset Hound',                     fciGroup: 6, fciNumber: 163 },
  { slug: 'beagle',                     nameSv: 'Beagle',                        nameEn: 'Beagle',                           fciGroup: 6, fciNumber: 161 },
  { slug: 'bloodhound',                 nameSv: 'Blodhund',                      nameEn: 'Bloodhound',                       fciGroup: 6, fciNumber: 84 },
  { slug: 'dalmatian',                  nameSv: 'Dalmatiner',                    nameEn: 'Dalmatian',                        fciGroup: 6, fciNumber: 153 },
  { slug: 'hamiltons_stovare',          nameSv: 'Hamiltonsstövare',             nameEn: "Hamilton's Hound",                 fciGroup: 6, fciNumber: 41 },
  { slug: 'rhodesian_ridgeback',        nameSv: 'Rhodesian ridgeback',           nameEn: 'Rhodesian Ridgeback',              fciGroup: 6, fciNumber: 146 },
  { slug: 'schillerstovare',            nameSv: 'Schillerstövare',              nameEn: "Schiller's Hound",                 fciGroup: 6, fciNumber: 131 },
  { slug: 'smalandsstovare',            nameSv: 'Smålandsstövare',              nameEn: "Smalands Hound",                   fciGroup: 6, fciNumber: 129 },
  // ── Grupp 7: Stående fågelhundar ─────────────────────────────────────────
  { slug: 'braque_francais',            nameSv: 'Braque Français (Pyrénées)',    nameEn: 'Braque Français (Pyrénées)',       fciGroup: 7, fciNumber: 134 },
  { slug: 'brittany',                   nameSv: 'Brittanyspaniel',               nameEn: 'Brittany',                         fciGroup: 7, fciNumber: 95 },
  { slug: 'english_pointer',            nameSv: 'Pointer',                       nameEn: 'Pointer',                          fciGroup: 7, fciNumber: 1 },
  { slug: 'english_setter',             nameSv: 'Engelsk setter',               nameEn: 'English Setter',                   fciGroup: 7, fciNumber: 2 },
  { slug: 'german_longhaired_pointer',  nameSv: 'Tysk långhårig vorsteh',       nameEn: 'German Longhaired Pointer',        fciGroup: 7, fciNumber: 117 },
  { slug: 'german_shorthaired_pointer', nameSv: 'Tysk korthårig vorsteh',       nameEn: 'German Shorthaired Pointer',       fciGroup: 7, fciNumber: 119 },
  { slug: 'gordon_setter',              nameSv: 'Gordonsetter',                  nameEn: 'Gordon Setter',                    fciGroup: 7, fciNumber: 6 },
  { slug: 'hungarian_vizsla',           nameSv: 'Ungersk vorsteh (Vizsla)',     nameEn: 'Hungarian Vizsla',                 fciGroup: 7, fciNumber: 57 },
  { slug: 'irish_red_setter',           nameSv: 'Irländsk rödsätterhund',       nameEn: 'Irish Red Setter',                 fciGroup: 7, fciNumber: 120 },
  { slug: 'irish_red_white_setter',     nameSv: 'Irländsk rödvit setter',       nameEn: 'Irish Red and White Setter',       fciGroup: 7, fciNumber: 330 },
  { slug: 'weimaraner',                 nameSv: 'Weimaraner',                    nameEn: 'Weimaraner',                       fciGroup: 7, fciNumber: 99 },
  { slug: 'wirehaired_pointing_griffon', nameSv: 'Korthals griffon',            nameEn: 'Wirehaired Pointing Griffon',      fciGroup: 7, fciNumber: 107 },
  // ── Grupp 8: Apporterande, stötande och vattenhundar ─────────────────────
  { slug: 'chesapeake_bay_retriever',   nameSv: 'Chesapeake Bay retriever',     nameEn: 'Chesapeake Bay Retriever',         fciGroup: 8, fciNumber: 263 },
  { slug: 'clumber_spaniel',            nameSv: 'Clumberspaniel',               nameEn: 'Clumber Spaniel',                  fciGroup: 8, fciNumber: 109 },
  { slug: 'cocker_spaniel',             nameSv: 'Cocker spaniel',               nameEn: 'English Cocker Spaniel',           fciGroup: 8, fciNumber: 5 },
  { slug: 'curly_coated_retriever',     nameSv: 'Krullig retriever',            nameEn: 'Curly Coated Retriever',           fciGroup: 8, fciNumber: 110 },
  { slug: 'flat_coated_retriever',      nameSv: 'Flatcoated retriever',         nameEn: 'Flat Coated Retriever',            fciGroup: 8, fciNumber: 116 },
  { slug: 'golden_retriever',           nameSv: 'Golden Retriever',             nameEn: 'Golden Retriever',                 fciGroup: 8, fciNumber: 111 },
  { slug: 'labrador',                   nameSv: 'Labrador Retriever',           nameEn: 'Labrador Retriever',               fciGroup: 8, fciNumber: 122 },
  { slug: 'nova_scotia_retriever',      nameSv: 'Nova Scotia duck tolling retriever', nameEn: 'Nova Scotia Duck Tolling Retriever', fciGroup: 8, fciNumber: 312 },
  { slug: 'portuguese_water_dog',       nameSv: 'Portugisisk vattenhund',       nameEn: 'Portuguese Water Dog',             fciGroup: 8, fciNumber: 37 },
  { slug: 'springer_spaniel_english',   nameSv: 'Engelsk springerspaniel',      nameEn: 'English Springer Spaniel',         fciGroup: 8, fciNumber: 125 },
  // ── Grupp 9: Sällskaps- och tyckhundar ───────────────────────────────────
  { slug: 'bichon_frise',               nameSv: 'Bichon Frisé',                nameEn: 'Bichon Frisé',                    fciGroup: 9, fciNumber: 215 },
  { slug: 'boston_terrier',             nameSv: 'Bostonterrier',                nameEn: 'Boston Terrier',                   fciGroup: 9, fciNumber: 140 },
  { slug: 'cavalier_king_charles',      nameSv: 'Cavalier King Charles Spaniel', nameEn: 'Cavalier King Charles Spaniel',  fciGroup: 9, fciNumber: 136 },
  { slug: 'chihuahua',                  nameSv: 'Chihuahua',                     nameEn: 'Chihuahua',                        fciGroup: 9, fciNumber: 218 },
  { slug: 'french_bulldog',             nameSv: 'Fransk bulldogg',              nameEn: 'French Bulldog',                   fciGroup: 9, fciNumber: 101 },
  { slug: 'havanese',                   nameSv: 'Havaneser',                     nameEn: 'Havanese',                         fciGroup: 9, fciNumber: 250 },
  { slug: 'italian_greyhound',          nameSv: 'Italiensk vinthund',           nameEn: 'Italian Greyhound',                fciGroup: 9, fciNumber: 200 },
  { slug: 'maltese',                    nameSv: 'Malteser',                      nameEn: 'Maltese',                          fciGroup: 9, fciNumber: 65 },
  { slug: 'papillon',                   nameSv: 'Papillon',                      nameEn: 'Papillon',                         fciGroup: 9, fciNumber: 77 },
  { slug: 'poodle_miniature',           nameSv: 'Dvärgpudel',                   nameEn: 'Miniature Poodle',                 fciGroup: 9, fciNumber: 172 },
  { slug: 'poodle_standard',            nameSv: 'Pudel (stor)',                  nameEn: 'Standard Poodle',                  fciGroup: 9, fciNumber: 172 },
  { slug: 'poodle_toy',                 nameSv: 'Toy pudel',                     nameEn: 'Toy Poodle',                       fciGroup: 9, fciNumber: 172 },
  { slug: 'pug',                        nameSv: 'Mops',                          nameEn: 'Pug',                              fciGroup: 9, fciNumber: 253 },
  { slug: 'shih_tzu',                   nameSv: 'Shih Tzu',                      nameEn: 'Shih Tzu',                         fciGroup: 9, fciNumber: 208 },
  // ── Grupp 10: Vinthundar ─────────────────────────────────────────────────
  { slug: 'afghan_hound',               nameSv: 'Afghansk vinthund',            nameEn: 'Afghan Hound',                     fciGroup: 10, fciNumber: 228 },
  { slug: 'borzoi',                     nameSv: 'Borzoj',                        nameEn: 'Borzoi',                           fciGroup: 10, fciNumber: 193 },
  { slug: 'greyhound',                  nameSv: 'Greyhound',                     nameEn: 'Greyhound',                        fciGroup: 10, fciNumber: 158 },
  { slug: 'saluki',                     nameSv: 'Saluki',                        nameEn: 'Saluki',                           fciGroup: 10, fciNumber: 269 },
  { slug: 'whippet',                    nameSv: 'Whippet',                       nameEn: 'Whippet',                          fciGroup: 10, fciNumber: 162 },
]

export function isValidBreed(slug: string): boolean {
  return BREED_REGISTRY.some((b) => b.slug === slug)
}

export function getBreedEntry(slug: string): BreedEntry | undefined {
  return BREED_REGISTRY.find((b) => b.slug === slug)
}
