'use client';
import { useEffect, useMemo, useState } from 'react';
import './styles/nibbly.scss';
import { Space_Mono } from "next/font/google";
import shuffle from '@/utils/shuffle';
import FoodRow from './_components/FoodRow/FoodRow';

const spaceMono = Space_Mono({
    subsets: ['latin'],
    weight: ['400', '700'],
    variable: '--font-space-mono', // define CSS variable
  });


type Props = {
    children: React.ReactNode | React.ReactNode[]
}


const foodImages = [
    '/nibbly/foods/bagel.png',
    '/nibbly/foods/banana_split.png',
    '/nibbly/foods/burger_fries.png',
    '/nibbly/foods/coffee.png',
    '/nibbly/foods/mac_n_cheese.png',
    '/nibbly/foods/pancakes.png',
    '/nibbly/foods/pizza.png',
    '/nibbly/foods/salad.png',
    '/nibbly/foods/sandwich.png',
    '/nibbly/foods/sushi.png',
    '/nibbly/foods/bacon.png',
    '/nibbly/foods/taco.png',
    '/nibbly/foods/doughnut.png',
    '/nibbly/foods/ramen.png',
    '/nibbly/foods/cheesecake.png',
    '/nibbly/foods/falafel.png',
    '/nibbly/foods/bento.png',
    '/nibbly/foods/ravioli.png',
    '/nibbly/foods/turkey.png',
    '/nibbly/foods/steak.png',
    '/nibbly/foods/burrito.png',
    '/nibbly/foods/cereal.png',
    '/nibbly/foods/grilled_cheese.png',
    '/nibbly/foods/deli.png',
    '/nibbly/foods/beer.png',
    '/nibbly/foods/curry.png',
    '/nibbly/foods/apple_pie.png',
    '/nibbly/foods/popcorn.png',
    '/nibbly/foods/spaghetti.png',
    '/nibbly/foods/full_english.png',
  ];

  export default function NibblyRoot({ children }: Props) {
    const rowHeight = 95;
    const numberOfRows = 10;
  
    const [rows, setRows] = useState<string[][] | null>(null);
  
    useEffect(() => {
      const shuffled = Array.from({ length: numberOfRows }, () =>
        shuffle(foodImages)
      );
      setRows(shuffled);
    }, []);
  
    return (
      <div className={`nibbly-root ${spaceMono.variable}`}>
        <div className="nibbly-rows">
          {rows?.map((images, i) => (
            <FoodRow
              key={i}
              images={images}
              direction={i % 2 === 0 ? 'right' : 'left'}
              rowHeight={rowHeight}
              speed={20}
            />
          ))}
        </div>
  
        <main className="nibbly-overlay">{children}</main>
      </div>
    );
  }