function randomInteger(min, max) { //функция рандома
  // случайное число от min до (max+1)
  let rand = min + Math.random() * (max + 1 - min);
  return Math.floor(rand);
}

function calcProgramsLine(TzMIN, TzMAX, TsMIN, TsMAX, TIMEWORK) { //нахождение программ по линейному закону
  let programs = [];
  let t = 0;
  let lastT = 0;
  while (t <= TIMEWORK) {
    const U = randomInteger(1, 100) / 100;
    const tPrihod = (TzMAX - TzMIN) * U + TzMIN;
    const tObrabotka = (TsMAX - TsMIN) * U + TsMIN;
    const T = lastT + tPrihod;

    if (T <= TIMEWORK) {
      programs.push({
        U: U,
        tPrihod: tPrihod,
        tObrabotka: tObrabotka,
        time: T,
        inBoof: false,
      });
    }

    lastT = T;
    t = T - programs[0].time; //т.к. ВС начинает работу с приходом первой программы
  }

  return programs;
}

function calcProgramsExp(lambda, Mu, TIMEWORK) { //нахождение программ по экспоненциальному закону
  let programs = [];
  let t = 0;
  let lastT = 0;
  while (t <= TIMEWORK) {
    const U = randomInteger(1, 100) / 100;
    const tPrihod = -1 / lambda * Math.log(U);
    const tObrabotka = -1 / Mu * Math.log(U);
    const T = lastT + tPrihod;

    if (T <= TIMEWORK) {
      programs.push({
        U: U,
        tPrihod: tPrihod,
        tObrabotka: tObrabotka,
        time: T,
        inBoof: false,
      });
    }

    lastT = T;
    t = T - programs[0].time; //т.к. ВС начинает работу с приходом первой программы
  }

  return programs;
}

function creatServers(n) { // создание серверов
  let servers = [];
  for (let i = 0; i < n; i++) {
    servers.push({ id: i + 1, array: [], t: 0, downTime: 0 })
  }
  return servers;
  //array - массив программ поступивших на данный сервер, downTime - время простоя сервера
  //t - время, когда освободится сервер, id - номер сервера
}

function modeling(programs, servers, n, m, time, L, Mu) { //моделирование работы ВС с расчетом характеристик
  let boof = []; //буфер
  let count = 0; //кол-во необработанных программ
  let P = []; //массив вероятноесте P0 - P7
  for (let i = 0; i <= n + m; i++) { //заполняем массив вероятностей нулями, чтобы не было ошибок в вычислении
    P.push(0);
  }
  let arrayForParametrs = [{time: 0, flagPrihoda: false}]; //массив для вычисления вероятностей

  for (let i = 0; i < programs.length; i++) { //цикл по заявкам (программам)

    let fl = true;  //если true, то программа не попадает на сервер
    for (let j = 0; j < n; j++) { //цикл по серверам

      while (programs[i].time > servers[j].t) { //пока сервер свободен
        if (boof.length > 0) { //если в буфере есть заявки, то обработаем сначала их

          //вычисляем время для вероятностей
          servers.sort((elem1, elem2) => elem1.t - elem2.t);
          arrayForParametrs.sort((elem1, elem2) => elem1.time - elem2.time);
          arrayForParametrs[1].flagPrihoda = 'true';

          if (arrayForParametrs[1].time + boof[0].tObrabotka <= time) { //если время превысило 3600
            arrayForParametrs.push({ time: arrayForParametrs[1].time + boof[0].tObrabotka, flagPrihoda: false });
          } else {
          arrayForParametrs.push({ time: time, flagPrihoda: false });
          }

          arrayForParametrs.sort((elem1, elem2) => elem1.time - elem2.time);
          P[n + boof.length] += arrayForParametrs[1].time - arrayForParametrs[0].time;
          arrayForParametrs.shift();
          arrayForParametrs[0].flagPrihoda = false;

          //добавляем программу из буфера на сервер
          const progaOutBoof = boof.shift();
          servers[0].array.push(progaOutBoof);
          servers[0].t += progaOutBoof.tObrabotka;
          servers.sort((elem1, elem2) => elem1.id - elem2.id);

        } else { //в буфере пусто, поэтому добавляем программу на сервер

          //вычисляем время для вероятностей
            arrayForParametrs.push({ time: programs[i].time, flagPrihoda: true });

            if (programs[i].time + programs[i].tObrabotka <= time) {
              arrayForParametrs.push({ time: programs[i].time + programs[i].tObrabotka, flagPrihoda: false });
            } else {
              arrayForParametrs.push({ time: time, flagPrihoda: false });
            }

            let flag = false; //флаг проверки первого элемента массива для вычисления вероятностей

            while (!flag) {
              arrayForParametrs.sort((elem1, elem2) => elem1.time - elem2.time);
              let countServers = 0;

              for (let k = 0; k < n; k++) {
                if (arrayForParametrs[1].time <= servers[k].t) {
                  countServers++;
                }
              }

              P[countServers] += arrayForParametrs[1].time - arrayForParametrs[0].time;
              arrayForParametrs.shift();
              if (arrayForParametrs[0].flagPrihoda) {
                flag = true;
                arrayForParametrs[0].flagPrihoda = false;
              }
            }

            //добавляем программу на сервер
            servers[j].array.push(programs[i]);
            servers[j].downTime += programs[i].time - servers[j].t; //время простоя сервера
            servers[j].t = programs[i].time + programs[i].tObrabotka;
            fl = false; //программа попала на сервер, поэтому программа в буфер не попадет
        }
      }

      if (!fl) { //если программа попала на сервер, то прекращаем перебор по серверам
        break;
      }
    }

    if (fl) { //если программа не попала на сервер, то
      if (boof.length < m) { //есть ли место в буфере

        //считаем время для вероятностей
        arrayForParametrs.push({ time: programs[i].time, flagPrihoda: true });
        arrayForParametrs.sort((elem1, elem2) => elem1.time - elem2.time);
        P[n + boof.length] += arrayForParametrs[1].time - arrayForParametrs[0].time;
        arrayForParametrs.shift();
        arrayForParametrs[0].flagPrihoda = false;

        //добавляем программу в буфер
        programs[i].inBoof = true;
        boof.push(programs[i]);

      } else { //если программа не обрабатывается
        count++; //считаем кол-во необработанных программ
      }
    }
  }

  while (boof.length > 0) { //если в буфере остались программы в конце
    servers.sort((elem1, elem2) => elem1.t - elem2.t)

    //вычисляем время для вероятностей
    arrayForParametrs.sort((elem1, elem2) => elem1.time - elem2.time);
    arrayForParametrs[1].flagPrihoda = 'true';

    if (arrayForParametrs[1].time + boof[0].tObrabotka <= time) {
      arrayForParametrs.push({ time: arrayForParametrs[1].time + boof[0].tObrabotka, flagPrihoda: false });
    } else {
      arrayForParametrs.push({ time: time, flagPrihoda: false });
    }

    arrayForParametrs.sort((elem1, elem2) => elem1.time - elem2.time);
    P[n + boof.length] += arrayForParametrs[1].time - arrayForParametrs[0].time;
    arrayForParametrs.shift();
    arrayForParametrs[0].flagPrihoda = false;

    //вытаскиваем программы из буфера и отправляем на сервер
    const progaOutBoof = boof.shift();
    servers[0].array.push(progaOutBoof);
    servers[0].t += progaOutBoof.tObrabotka;
    servers.sort((elem1, elem2) => elem1.id - elem2.id)
  }


  //вычисление остальных хар-к
  const Ro = L / Mu;
  const X = Ro/n;

  const otkazP = count/programs.length; //вероятность отказа в обслуживании заявки
  const Q = 1 - otkazP; //Относительная пропускная способность
  const S = L * Q; //Абсолютная пропускная способность
  const K = S / Mu; //Среднее число занятых каналов
  const BoofN = calcBoofN(Ro, n, m, X, (P[0]/time)); //среднее число программ в буфере
  const ProgN = K + BoofN; //среднее число программ в ВС
  const BoofT = BoofN / (Ro * Mu); //среднее время нахождения программы в буфере
  const ProgT = BoofT + Q / Mu; //среднее время нахождения программы в ВС

let text = `Результат работы ВС за ${time} секунд:`;
for (let i = 0; i < n; i++) {
  text += `\nВремя простоя первого сервера ${servers[i].downTime.toFixed(2)} секунд;\nКол-во программ поступившик на этот сервер ${servers[i].array.length};`
}

for (let i = 0; i <= n + m; i++) {
  text += `\nP[${i}] = ${(P[i] / time).toFixed(5)};`
}

text += `\nВероятность отказа: ${otkazP.toFixed(3)};
Относительная пропускная способность ВС: ${Q.toFixed(3)};
Абсолютная пропускная способность ВС: ${S.toFixed(3)};
Среднее число занятых серверов: ${K.toFixed(3)};
Среднее число программ в буфере: ${BoofN.toFixed(3)};
Среднее чесло программ в ВС: ${ProgN.toFixed(3)};
Среднее время нахождения программы в буфере: ${BoofT.toFixed(3)};
Среднее время нахождения программы в ВС: ${ProgT.toFixed(3)};`

  return (text);
}

//let button = document.getElementById('button'); //кнопка "Смоделировать ВС и рассчитать ее параметры"
let coclusionLine = document.querySelector('.conclusion-line'); //поле вывода резулятата при линейном распределении
let conclusionExponential = document.querySelector('.conclusion-exponential'); //поле вывода резулятата при экспоненциальном распределении

function parse(str) { //функция парсинка данных из input
  if (str.indexOf('/', 0) != -1) {
    const arr = str.split('/');
    return +arr[0] / +arr[1];
  } else {
    return + str;
  }

}

function getData() { //функция получения данных из интерфейса
  return ({
    N: + document.getElementById('N').value, //кол-во серверов
    M: + document.getElementById('M').value, //кол-во мест в буфере
    timework: parse(document.getElementById('timework').value),
    TzMIN: parse(document.getElementById('Tzmin').value),
    TzMAX: parse(document.getElementById('Tzmax').value),
    TsMIN: parse(document.getElementById('Tsmin').value),
    TsMAX: parse(document.getElementById('Tsmax').value),
    lambda: parse(document.getElementById('lambda').value),
    Mu: 1 / parse(document.getElementById('Tobr').value),
  })
}

function checkDistribution() { //функция для полчения данных о выборе закона распределения
  const inp = document.getElementsByName('distribution');
  for (let i = 0; i < inp.length; i++) {
    if (inp[i].type === "radio" && inp[i].checked) {
      return inp[i].value;
    }
  }
}

function clickButton () { //функция клика на кнопку
  const data = getData();
  const method = checkDistribution();

  let prog = [];

  const elem = { //объект с данными (нужно для вычисления хар-к по формулам)
    n: data.N,
    m: data.M
  }

  if (method === 'line') { //в зависимости от выбранного закона распределения, хар-ки программ вычисляются по разному
    prog = calcProgramsLine(data.TzMIN, data.TzMAX, data.TsMIN, data.TsMAX, data.timework);
    elem.l = Math.pow((data.TzMIN + data.TzMAX) / 2, -1);
    elem.mu = Math.pow((data.TsMIN + data.TsMAX) / 2, -1);
  } else {
    prog = calcProgramsExp(data.lambda, data.Mu, data.timework);
    elem.l = data.lambda;
    elem.mu = data.Mu;
  }

  let servers = creatServers(data.N); //создание серверов
  let conclusion = modeling(prog, servers, data.N, data.M, data.timework, elem.l, elem.mu); //моделирование и расчет хар-к ВС

  if (method === 'line') {
    coclusionLine.textContent = conclusion; //добавить переменную text в вывод, если нужен расчет по формулам
  } else {
    conclusionExponential.textContent = conclusion;
  }
}




