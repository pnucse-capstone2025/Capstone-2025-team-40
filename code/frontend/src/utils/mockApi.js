const pageContent = {
  fullItinerary: [
    {
      day: 1,
      items: [
        {
          id: '01',
          title: '코코플라토',
          openHours: 'OPEN 10:00 - 20:00',
          lat: 35.1593,
          lon: 129.1613,
          description: 'A cozy brunch spot. Accepts all major credit cards and local payment apps like KakaoPay.'
        },
        {
          id: '02',
          title: 'HAEUNDAE SKY CAPSULE',
          openHours: 'OPEN 10:00 - 20:00',
          lat: 35.1587,
          lon: 129.1729,
          description: 'Purchase tickets online or at the booth. Accepts Visa, Mastercard, and American Express.'
        },
        {
          id: '03',
          title: '리얼스위아카데미 X SKY',
          openHours: 'OPEN 10:00 - 20:00',
          lat: 35.1700,
          lon: 129.1285,
          description: 'Golf simulator reservations can be paid for at the front desk. Membership packages are available.'
        },
        {
          id: '04',
          title: '심미안',
          openHours: 'OPEN 10:00 - 20:00',
          lat: 35.1541,
          lon: 129.1610,
          description: 'A traditional tea house. Please note that it is a cash-only establishment.'
        },
        {
          id: '05',
          title: '원조석대추어탕',
          openHours: 'OPEN 10:00 - 20:00',
          lat: 35.2289,
          lon: 129.1121,
          description: 'Famous loach soup restaurant. Accepts credit cards and Naver Pay for your convenience.'
        },
        {
          id: '06',
          title: '체스154',
          openHours: 'OPEN 10:00 - 20:00',
          lat: 35.1565,
          lon: 129.0641,
          description: 'A charming cafe with a chess theme. Pay at the counter via card or cash.'
        },
      ]
    },
    {
      day: 2,
      items: [
        {
          id: '01',
          title: 'Gamcheon Culture Village',
          openHours: 'OPEN 09:00 - 18:00',
          lat: 35.0976,
          lon: 129.0107,
          description: 'Entry is free, but some workshops and galleries may charge a small fee, typically in cash.'
        },
        {
          id: '02',
          title: 'Jagalchi Market',
          openHours: 'OPEN 05:00 - 22:00',
          lat: 35.0963,
          lon: 129.0303,
          description: 'Most vendors prefer cash, especially for smaller purchases. Some larger stalls accept cards.'
        },
        {
          id: '03',
          title: 'Busan Tower',
          openHours: 'OPEN 10:00 - 22:00',
          lat: 35.0954,
          lon: 129.0326,
          description: 'Observation deck tickets can be bought at the entrance. All major credit cards are accepted.'
        },
        {
          id: '04',
          title: 'BIFF Square',
          openHours: 'ALWAYS OPEN',
          lat: 35.0970,
          lon: 129.0280,
          description: 'Street food vendors are primarily cash-based. Have some won ready for delicious treats.'
        },
        {
          id: '05',
          title: 'Songdo Cable Car',
          openHours: 'OPEN 09:00 - 20:00',
          lat: 35.0715,
          lon: 129.0195,
          description: 'Ticket options include standard and crystal cabins. Pay online for a discount or at the kiosk.'
        },
      ]
    }
  ],
  // The global paymentDescription has been removed.
  summaryText:
    "IF YOU'RE LOOKING FOR A WELL-ROUNDED EXPERIENCE, THIS ITINERARY BRINGS TOGETHER GREAT FOOD, UNIQUE ACTIVITIES, AND COZY SPOTS TO RELAX. THE WEATHER MAKES IT ESPECIALLY ENJOYABLE, WHETHER YOU'RE TAKING IN THE STUNNING COASTAL VIEWS FROM THE SKY CAPSULE, TRYING SOMETHING REFRESHING AND ACTIVE AT 리얼스윙아카데미 X SKY ISLAND, OR UNWINDING WITH A DRINK AT 심미안. THE LOCAL FLAVORS AT 코코플라토 AND 원조석대추어탕 ARE HIGHLY RECOMMENDED FOR ANYONE WHO ENJOYS DELICIOUS, COMFORTING MEALS, AND 체스154 OFFERS A FUN AND INVITING ATMOSPHERE TO ROUND OUT THE DAY. ALTOGETHER, IT'S A MIX OF ADVENTURE, RELAXATION, AND GREAT TASTES THAT PAIRS PERFECTLY WITH THE PLEASANT WEATHER.",
  weatherForecasts: [
    { day: 'SAT', iconUrl: 'https://openweathermap.org/img/wn/01d@2x.png', temp: 10 },
    { day: 'SUN', iconUrl: 'https://openweathermap.org/img/wn/09d@2x.png', temp: 15 },
    { day: 'MON', iconUrl: 'https://openweathermap.org/img/wn/03d@2x.png', temp: 11 },
    { day: 'TUE', iconUrl: 'https://openweathermap.org/img/wn/10d@2x.png', temp: 10 },
    { day: 'WED', iconUrl: 'https://openweathermap.org/img/wn/50d@2x.png', temp: 12 },
    { day: 'THU', iconUrl: 'https://openweathermap.org/img/wn/04d@2x.png', temp: 10 },
  ],
};

export const fetchPageData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(pageContent);
    }, 1500); // 1.5-second delay to simulate network
  });
};