(() => {
  const messages = [
    ['Нам нужны 18 комплектов подшипников к следующей пятнице. Куда отправить спецификацию?', 'sales', 'Запрос новой поставки с понятным предметом и сроком.'],
    ['Перестали обновляться карточки заказов в CRM. Последнее обновление было в 09:15.', 'support', 'Описан сбой в существующем процессе.'],
    ['Здравствуйте! Можно обсудить один вопрос?', 'clarify', 'Тема и ожидаемый результат пока неизвестны.'],
    ['Отправьте, пожалуйста, КП на регулярную поставку фильтров. Спецификация готова.', 'sales', 'Клиент просит коммерческое предложение на новую поставку.'],
    ['В заказе № 104 приехало меньше позиций, чем в накладной. Как оформить обращение?', 'support', 'Вопрос касается уже оформленного заказа.'],
    ['Мне нужно, чтобы всё работало быстрее. Что можете предложить?', 'clarify', 'Сначала нужно узнать, какой процесс и что именно в нём тормозит.']
  ];
  const start = document.getElementById('start-routing');
  const next = document.getElementById('next-routing');
  const round = document.getElementById('routing-round');
  const count = document.getElementById('route-count');
  const message = document.getElementById('route-message');
  const feedback = document.getElementById('route-feedback');
  const buttons = [...round.querySelectorAll('[data-route]')];
  let index = 0;
  let score = 0;

  function showRound() {
    message.textContent = messages[index][0];
    count.textContent = `${index + 1} / ${messages.length}`;
    feedback.textContent = 'Выберите маршрут для сообщения.';
    round.hidden = false;
    next.hidden = true;
    buttons.forEach(button => {
      button.disabled = false;
      button.setAttribute('aria-pressed', 'false');
    });
    buttons[0].focus({preventScroll: true});
  }

  start.addEventListener('click', () => {
    index = 0;
    score = 0;
    next.textContent = 'Дальше →';
    start.textContent = 'Начать заново ↻';
    showRound();
  });

  buttons.forEach(button => button.addEventListener('click', () => {
    const [, expected, reason] = messages[index];
    const correct = button.dataset.route === expected;
    if (correct) score += 1;
    const answer = buttons.find(option => option.dataset.route === expected).textContent.split(' · ')[1];
    feedback.textContent = `${correct ? 'Верно.' : `Подходит маршрут «${answer}».`} ${reason} Счёт ${score} из ${index + 1}.`;
    buttons.forEach(option => { option.disabled = true; });
    button.setAttribute('aria-pressed', 'true');
    next.textContent = index + 1 === messages.length ? 'Показать итог →' : 'Дальше →';
    next.hidden = false;
    next.focus({preventScroll: true});
  }));

  next.addEventListener('click', () => {
    index += 1;
    if (index < messages.length) {
      showRound();
      return;
    }
    round.hidden = true;
    next.hidden = true;
    count.textContent = 'Игра завершена';
    feedback.textContent = `Итог: ${score} из ${messages.length} верных маршрутов. В рабочем процессе похожие правила можно проверить на примерах команды.`;
    start.textContent = 'Сыграть ещё ↻';
    start.focus({preventScroll: true});
  });
})();
