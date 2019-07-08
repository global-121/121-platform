var programPost = {
  location: 'Lilongwe',
  countryId: 265,
  title: 'Pilot program 1a',
  description: 'Program to help people hit by earthquake examplename',
  startDate: '07/08/2019',
  endDate: '07/08/2019',
  currency: 'MWK',
  distributionFrequency: 'what is this',
  distributionChannel: 'mobileMoney',
  notifiyPaArea: true,
  notificationType: 'announcement',
  cashDistributionSites: [],
  FSPs: [],
  scoringType: 'standard', // Only option for now later, it can also be a fancy algorithm
  criteria: [
    {
      criterium: 'Age',
      question: {
        english: 'What is your age?',
        nyanja: 'Zaka zanu ndi zingati?',
      },
      answerType: 'numeric',
      criteriumType: 'standard',
      options: null,
      scoring: {
        '0-18': 999, // Excluse if younger then 18
        '19-65': 0,
        '65>': 6,
      },
    },
    {
      criterum: 'RoofType',
      question: {
        english: 'What type is your roof?',
        nyanja: 'Denga lanu ndi lotani?',
      },
      answerType: 'dropdown',
      options: [
        {
          id: 0,
          option: 'steel',
          name: {
            english: 'steel',
            nyanja: 'zitsulo',
          },
        },
        {
          id: 1,
          option: 'tiles',
          name: {
            english: 'tiles',
            nyanja: 'matayala',
          },
          score: 6,
        },
      ],
      scoring: {
        0: 3,
        1: 6,
      },
    },
  ],
};
