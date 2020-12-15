const factorial = (n) => {
  return (n != 1) ? n * factorial(n - 1) : 1
}

const math1 = (r, n) => {   //функция нахождения вероятности загруски сервера
  return (Math.pow(r, n) / factorial(n))
}

const math2 = (r, n, m) => { //функция нахождения вероятности загрузки буфера
  return (Math.pow(r, (n + m)) / (Math.pow(n, m) * factorial(n)) )
}

const calcP0 = (r, n, m) => {  //функция нахождения P0 - вероятность того, что ВС не загружена
  let sum1 = 0;
  let sum2 = 0;
  for (let i = 1; i <= n; i++) {
    sum1 += math1(r, i)
  }

  for (let j = 1; j <= m; j++) {
    sum2 += math2(r, n, j)
  }

  return Math.pow((1 + sum1 + sum2), -1)
}

let calcP = (r, n, m) => { //функция вычисления всех предельных вероятностей

  let P = [];

  P[0] = calcP0(r, n, m);

  for (let k = 1; k <= n; k++) { //Вычисление P1, P2, P3, P4
    P[k] = math1(r, k) * P[0]
  }

  for (let j = 1; j <= m; j++) { //Вычисление P5, P6, P7
    P[n + j] = math2(r, n, j) * P[0]
  }

  return P;

}

const calcBoofN = (r, n, m, x, p0) => { //функция нахождения среднего числа программ в буфере

  let E = 0;
  if (x === 1) {
    for (let i = 0; i < m; i ++) {
      E += (i + 1) * Math.pow(x, i);
    }
  } else {
    E = (1 - Math.pow(x, m) * (m + 1 - m*x))/Math.pow( (1-x), 2);
  }
  return (math2(r, n, 1) * p0 * E);
}

function calcParameters (elem) {

  const N = elem.n; //кол-во серверов
  const M = elem.m; //размер очереди (буфера)
  const L = elem.l; //интенсивность потока
  const Mu = elem.mu; //интенсивность потока обслуживания

  const Ro = L / Mu;
  const X = Ro/N;

  const P = calcP(Ro, N, M); //массив предельных вероятностей

  const otkazP = math2(Ro, N, M) * P[0]; //вероятность отказа в обслуживании заявки
  const Q = 1 - otkazP; //Относительная пропускная способность
  const S = L * Q; //Абсолютная пропускная способность
  const K = S / Mu; //Среднее число занятых каналов
  const BoofN = calcBoofN(Ro, N, M, X, P[0]); //среднее число программ в буфере
  const ProgN = K + BoofN; //среднее число программ в ВС
  const BoofT = BoofN / (Ro * Mu); //среднее время нахождения программы в буфере
  const ProgT = BoofT + Q / Mu; //среднее время нахождения программы в ВС

  return (`\nP0 = ${P[0].toFixed(3)}; \nP1 = ${P[1].toFixed(3)}; \nP2 = ${P[2].toFixed(3)}; \nP3 = ${P[3].toFixed(3)}; \nP4 = ${P[4].toFixed(3)};
  P5 = ${P[5].toFixed(3)}; \nP6 = ${P[6].toFixed(3)}; \nP7 = ${P[7].toFixed(3)};
  \nВероятность отказа: ${otkazP.toFixed(3)};
  Относительная пропускная способность ВС: ${Q.toFixed(3)};
  Абсолютная пропускная способность ВС: ${S.toFixed(3)};
  Среднее число занятых серверов: ${K.toFixed(3)};
  Среднее число программ в буфере: ${BoofN.toFixed(3)};
  Среднее чесло программ в ВС: ${ProgN.toFixed(3)};
  Среднее время нахождения программы в буфере: ${BoofT.toFixed(3)};
  Среднее время нахождения программы в ВС: ${ProgT.toFixed(3)}`);
}

//перед выводом вставить это
  // //Если нужно посчитать хар-ки по формулам, то добавь вывод в интерфейс
  // const parametrs = calcParameters(elem);//вычисление характеристик ВС по формулам
  // let text = `\n\nХарактеристики ВС по формулам: ` + parametrs;