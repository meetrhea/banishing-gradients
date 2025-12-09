export interface Author {
  slug: string;
  name: string;
  title: string;
  bio: string;
  imageUrl?: string;
  email?: string;
  yearsAtPaper: number;
}

export const authors: Author[] = [
  {
    slug: 'chester-worthington-iii',
    name: 'Chester Worthington III',
    title: 'Investigative Correspondent',
    bio: `Chester Worthington III has been investigating things since 1974, when he first questioned why his mother's meatloaf tasted like cardboard. A graduate of the Columbia School of Journalism (class of '78), Chester spent two decades covering city hall corruption before pivoting to AI coverage after his editor told him "computers are the future" in 2019. He still doesn't know what a GPU is but remains confident it's probably bad. Chester has won seventeen journalism awards, all of which he keeps in a shoebox under his desk because "awards are for amateurs." He takes his coffee black, his news serious, and his sources anonymous.`,
    yearsAtPaper: 51,
  },
  {
    slug: 'margaret-mcallister',
    name: 'Margaret "Maggie" McAllister',
    title: 'Senior Technology Editor',
    bio: `Margaret McAllister—"Maggie" to anyone who values their kneecaps—joined the paper in 1982 after a brief stint writing fortunes for a cookie company in San Francisco. She has covered every major technology trend from the dot-com boom to the crypto bust, maintaining a perfect record of skepticism that has aged remarkably well. Maggie was the first journalist to accurately predict that "the metaverse is just Second Life for people with too much money," a quote that earned her a lifetime ban from Meta's press events. She lives in Brooklyn with three cats named after failed startups: Pets.com, Theranos, and WeWork.`,
    yearsAtPaper: 43,
  },
  {
    slug: 'harold-finch-jr',
    name: 'Harold Finch Jr.',
    title: 'Industry Analyst',
    bio: `Harold Finch Jr. reluctantly inherited his father's press credentials in 1991 after Harold Sr. was escorted out of a Steve Jobs keynote for "asking too many follow-up questions." The younger Finch has since dedicated his career to asking exactly the right number of follow-up questions—usually one more than PR departments prefer. He holds the distinction of being the only journalist to have been sued by three different AI companies simultaneously, all of which later went bankrupt. Harold attributes his success to "a healthy distrust of anyone who says 'revolutionary' more than twice in a sentence."`,
    yearsAtPaper: 34,
  },
  {
    slug: 'rita-chen',
    name: 'Rita Chen',
    title: 'Culture & Society Reporter',
    bio: `Rita Chen covers the intersection of technology and whatever remains of human dignity. A former philosophy professor who "got tired of students asking if ChatGPT wrote her syllabus," she joined the paper in 2021 with the specific mission of "making tech executives feel as uncomfortable as possible." Her column, "The Algorithm Doesn't Care About Your Feelings," has been called "essential reading" by three psychiatrists and "deeply troubling" by every VC she's ever interviewed. Rita believes that all technology is ultimately a monument to human hubris, but she says it with such charm that people keep inviting her to conferences anyway.`,
    yearsAtPaper: 4,
  },
];

export function getAuthorBySlug(slug: string): Author | undefined {
  return authors.find(a => a.slug === slug);
}

export function getAuthorByName(name: string): Author | undefined {
  return authors.find(a => a.name === name || a.name.includes(name));
}
