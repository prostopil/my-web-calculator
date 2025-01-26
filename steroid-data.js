const STEROID_DATA = {
  'testosterone': {
    name: 'Тестостерон',
    esters: {
      'propionate': {
        name: 'Пропионат',
        halfLife: 0.8,
        activePeriod: 2.5,
        peakTime: 0.5,
        description: 'Короткий эфир тестостерона. Период полувыведения около 20 часов.',
        color: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        unit: 'мкг/л' 
      },
      'enanthate': {
        name: 'Энантат',
        halfLife: 4.5,
        activePeriod: 15,
        peakTime: 2.5,
        description: 'Длинный эфир тестостерона. Период полувыведения 4-5 дней.',
        color: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        unit: 'мкг/л'
      },
      'cypionate': {
        name: 'Ципионат',
        halfLife: 5,
        activePeriod: 16,
        peakTime: 3,
        description: 'Длинный эфир тестостерона. Период полувыведения около 5 дней.',
        color: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        unit: 'мкг/л'
      }
    }
  },
  'nandrolone': {
    name: 'Нандролон',
    esters: {
      'decanoate': {
        name: 'Деканоат',
        halfLife: 7,
        activePeriod: 21,
        peakTime: 4,
        description: 'Длинный эфир нандролона. Пери!од полувыведения 6-7 дней.',
        color: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)'
      },
      'phenylpropionate': {
        name: 'Фенилпропионат',
        halfLife: 1.5,
        activePeriod: 4.5,
        peakTime: 1,
        description: 'Короткий эфир нандролона. Период полувыведения около 1.5 дней.',
        color: 'rgba(255, 159, 64, 0.2)',
        borderColor: 'rgba(255, 159, 64, 1)'
      }
    }
  },
  'trenbolone': {
    name: 'Тренболон',
    esters: {
      'acetate': {
        name: 'Ацетат',
        halfLife: 1,
        activePeriod: 3,
        peakTime: 0.5,
        description: 'Короткий эфир тренболона. Период полувыведения около 24 часов.',
        color: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)'
      },
      'enanthate': {
        name: 'Энантат',
        halfLife: 5,
        activePeriod: 15,
        peakTime: 2.5,
        description: 'Длинный эфир тренболона. Период полувыведения около 5 дней.',
        color: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)'
      }
    }
  },
  'boldenone': {
    name: 'Болденон',
    esters: {
      'undecylenate': {
        name: 'Ундесиленат',
        halfLife: 14,
        activePeriod: 42,
        peakTime: 7,
        description: 'Очень длинный эфир. Период полувыведения около 14 дней.',
        color: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)'
      }
    }
  },
  'masteron': {
    name: 'Мастерон',
    esters: {
      'propionate': {
        name: 'Пропионат',
        halfLife: 0.8,
        activePeriod: 2.5,
        peakTime: 0.5,
        description: 'Короткий эфир мастерона. Период полувыведения около 20 часов.',
        color: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)'
      },
      'enanthate': {
        name: 'Энантат',
        halfLife: 4.5,
        activePeriod: 15,
        peakTime: 2.5,
        description: 'Длинный эфир мастерона. Период полувыведения 4-5 дней.',
        color: 'rgba(255, 159, 64, 0.2)',
        borderColor: 'rgba(255, 159, 64, 1)'
      }
    }
  },
  'oxymetholone': {
    name: 'Анаполон',
    esters: {
      'oral': {
        name: 'Оральный',
        halfLife: 0.4,
        activePeriod: 1.2,
        peakTime: 0.2,
        description: 'Оральный стероид. Период полувыведения около 8-9 часов.',
        color: 'rgba(255, 206, 86, 0.2)',
        borderColor: 'rgba(255, 206, 86, 1)',
        isOral: true
      }
    }
  },
  'hcg': {
    name: 'Гонадотропин',
    isSupport: true,
    esters: {
      'standard': {
        name: 'Стандартный',
        halfLife: 1.5,
        activePeriod: 4.5,
        peakTime: 0.5,
        description: 'Гормон ХГЧ. Период полувыведения около 36 часов.',
        color: 'rgba(201, 203, 207, 0.2)',
        borderColor: 'rgba(201, 203, 207, 1)',
        isIU: true
      }
    }
  },
  'stanozolol': {
    name: 'Станозолол',
    esters: {
      'oral': {
        name: 'Оральный',
        halfLife: 0.375,
        activePeriod: 1,
        peakTime: 0.2,
        description: 'Оральный стероид. Период полувыведения около 9 часов.',
        color: 'rgba(156, 39, 176, 0.2)',
        borderColor: 'rgba(156, 39, 176, 1)',
        isOral: true
      },
      'injectable': {
        name: 'Инъекционный',
        halfLife: 1,
        activePeriod: 3,
        peakTime: 0.5,
        description: 'Инъекционная форма. Период полувыведения около 24 часов.',
        color: 'rgba(233, 30, 99, 0.2)',
        borderColor: 'rgba(233, 30, 99, 1)'
      }
    }
  },
  'clomiphene': {
    name: 'Кломифен',
    isSupport: true,
    esters: {
      'citrate': {
        name: 'Цитрат',
        halfLife: 5,
        activePeriod: 15,
        peakTime: 2,
        description: 'SERM для ПКТ. Период полувыведения около 5 дней.',
        color: 'rgba(0, 150, 136, 0.2)',
        borderColor: 'rgba(0, 150, 136, 1)',
        isPCT: true,
        isOral: true
      }
    }
  },
  'anastrozole': {
    name: 'Анастрозол',
    isSupport: true,
    esters: {
      'standard': {
        name: 'Стандартный',
        halfLife: 2,
        activePeriod: 6,
        peakTime: 1,
        description: 'Ингибитор ароматазы. Период полувыведения около 48 часов.',
        color: 'rgba(255, 87, 34, 0.2)',
        borderColor: 'rgba(255, 87, 34, 1)',
        isPCT: true,
        isOral: true
      }
    }
  },
  'cabergoline': {
    name: 'Каберголин',
    isSupport: true,
    esters: {
      'standard': {
        name: 'Стандартный',
        halfLife: 3,
        activePeriod: 7,
        peakTime: 1,
        description: 'Агонист дофамина для снижения пролактина. Период полувыведения 3 дня.',
        color: 'rgba(103, 58, 183, 0.2)',
        borderColor: 'rgba(103, 58, 183, 1)',
        isOral: true
      }
    }
  }
};