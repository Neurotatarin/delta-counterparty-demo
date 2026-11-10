(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const inboxCases = {
    request: {message:'Здравствуйте! Мы — мастерская «Лист». Хотим собирать заявки с сайта в одну таблицу. Около 30 обращений в неделю. Можно начать с прототипа?', title:'Заявка на автоматизацию', badge:'Новая заявка', fields:[['Организация','Мастерская «Лист»'],['Объём','Около 30 обращений / неделю'],['Задача','Сайт → таблица'],['Следующий шаг','Уточнить сервисы и поля']], note:'Подготовлена карточка для первичного разбора. Сроки и стоимость не определяются без уточнения задачи.', action:'Подтвердить создание карточки', success:'В демо-журнал добавлена карточка «Разобрать процесс мастерской „Лист“». Во внешней системе ничего не создано.'},
    incident: {message:'Я из команды «Кедр». После обновления таблицы перестали появляться новые заявки. Сегодня увидели три пропуска. Нужно проверить, на каком шаге обрывается сценарий.', title:'Обращение о сбое', badge:'Нужен разбор', fields:[['Тип','Сбой действующего сценария'],['Признак','Три пропущенные заявки'],['Маршрут','Техническая диагностика'],['Что запросить','Время события и журнал ошибок']], note:'Причина сбоя неизвестна. Нужны проверка цепочки и сверка данных. Повторный запуск — после проверки на дубли.', action:'Подтвердить задачу на диагностику', success:'В демо-журнал добавлена задача «Проверить маршрут заявки команды „Кедр“». Автоматический повтор не запускался.'},
    unclear: {message:'Добрый день. Нам нужен бот с ИИ. Сможете сделать? Хочется, чтобы помогал с работой.', title:'Сначала — уточнение', badge:'Мало данных', warning:true, fields:[['Запрос','Бот с ИИ'],['Пользователь','Не указан'],['Рабочий процесс','Не описан'],['Маршрут','Уточняющий вопрос']], note:'Черновик ответа: «Кто будет пользоваться ботом, какую повторяющуюся задачу он должен решать и где сейчас находятся данные?»', action:'Подтвердить черновик вопроса', success:'В демо-журнал сохранён черновик уточняющего вопроса. Сообщение никому не отправлено.'}
  };
  const meetings = {
    launch:{message:'Марина: Я подготовлю тексты до четверга.\nИлья: В пятницу проверю форму заявки.\nКоманда: Стартуем после проверки формы.\nЕщё нужно решить, кто отвечает за поддержку.', tasks:[['Подготовить тексты','Марина · до четверга'],['Проверить форму заявки','Илья · в пятницу'],['Начать запуск','После проверки формы · ответственный не указан']], question:'Кто отвечает за поддержку и кто подтверждает запуск? Календарные даты нужно уточнить: дата встречи не задана.'},
    unclear:{message:'Обсудили новую страницу. Было бы хорошо обновить тексты на следующей неделе. Кто-нибудь посмотрит форму. Дату запуска пока не выбирали.', tasks:[['Уточнить объём обновления текстов','Ответственный и точный срок не назначены'],['Назначить проверку формы','Исполнитель не определён'],['Согласовать дату запуска','Решение не принято']], question:'Кто берёт тексты и форму? Какие сроки согласованы? Эти пункты требуют уточнения и не считаются назначенными задачами.'}
  };
  const prompts = {
    vague:'Помогай клиентам и отвечай на вопросы об автоматизации. Будь полезным.',
    structured:'РОЛЬ: помощник по первичному разбору задачи.\nКОНТЕКСТ: клиент интересуется автоматизацией заявок.\nПРАВИЛО: не выдумывай цены и сроки. Если данных мало — задай до 3 вопросов.\nФОРМАТ: короткий ответ + список уточнений.\nГРАНИЦА: оценку проекта подтверждает человек.'
  };
  let inboxTimer;
  let activeBrief = '';
  const campaignParams = new URLSearchParams(window.location.search);
  const campaignTags = ['utm_source', 'utm_campaign', 'utm_content']
    .map(key => [key, campaignParams.get(key)])
    .filter(([, value]) => value && value.length <= 64 && !/[^a-zA-Z0-9_.-]/.test(value))
    .map(([key, value]) => `${key}=${value}`);
  const briefPresets = {
    realty: {type:'Автоматизацию процесса', source:'Документы и таблицы', task:'Хочу упорядочить работу агентства недвижимости: собирать сведения и документы по сделке, видеть пробелы и следующие действия. Мой текущий процесс: '},
    automation: {type:'Автоматизацию процесса', source:'Несколько систем', task:'Хочу убрать ручной перенос данных и связать рабочие сервисы. Сейчас мы делаем так: '},
    product: {type:'Программу или веб-инструмент', source:'Процесс ещё не настроен', task:'Хочу разработать сайт, приложение или ИИ-помощника. Кто будет пользоваться и какую задачу решать: '}
  };
  let lastPresetTask = '';
  document.querySelectorAll('[data-brief-preset]').forEach(link => link.addEventListener('click', () => {
    const preset = briefPresets[link.dataset.briefPreset];
    if (!preset) return;
    const input = $('brief-task');
    if (!input.value.trim() || input.value === lastPresetTask) {
      $('brief-type').value = preset.type;
      $('brief-source').value = preset.source;
      input.value = preset.task;
      lastPresetTask = preset.task;
      input.setCustomValidity('');
      activeBrief = '';
      $('brief-result').hidden = true;
    }
    input.focus({preventScroll:true});
    input.setSelectionRange(input.value.length, input.value.length);
  }));
  function activateTab(name, focus = false) {
    document.querySelectorAll('[data-tab]').forEach(button => {
      const active = button.dataset.tab === name;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
      if (active && focus) button.focus();
      $('panel-' + button.dataset.tab).hidden = !active;
    });
  }
  document.querySelectorAll('[data-tab]').forEach((button, index, tabs) => {
    button.addEventListener('click', () => activateTab(button.dataset.tab));
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) {event.preventDefault(); activateTab(tabs[next].dataset.tab, true);}
    });
  });
  document.querySelectorAll('[data-demo-link]').forEach(link => link.addEventListener('click', () => activateTab(link.dataset.demoLink)));
  function emptyResult(symbol, title, subtitle) {return `<div class="empty-result"><span aria-hidden="true">${symbol}</span><p>${title}</p><small>${subtitle}</small></div>`;}
  function resetInbox() {
    clearTimeout(inboxTimer);
    $('inbox-message').textContent = inboxCases[$('inbox-case').value].message;
    $('inbox-status').textContent = 'Ожидает запуска'; $('inbox-status').classList.remove('done');
    $('run-inbox').disabled = false; $('run-inbox').innerHTML = 'Запустить сценарий <span>→</span>';
    $('inbox-track').querySelectorAll('span').forEach(node => node.classList.remove('active'));
    $('inbox-result').innerHTML = emptyResult('↳','Одно сообщение.<br>Структура вместо ручного разбора.','Запустите сценарий слева.');
  }
  $('inbox-case').addEventListener('change', resetInbox);
  $('run-inbox').addEventListener('click', () => {
    const item = inboxCases[$('inbox-case').value];
    const steps = $('inbox-track').querySelectorAll('span');
    $('run-inbox').disabled = true; $('run-inbox').textContent = 'Обработка…';
    $('inbox-status').classList.remove('done'); $('inbox-result').innerHTML = '';
    const labels = ['Разбираем сообщение','Выбираем маршрут','Готовим результат'];
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function step(index) {
      steps[index].classList.add('active'); $('inbox-status').textContent = labels[index];
      if (index < 2) {inboxTimer = setTimeout(() => step(index + 1), reduceMotion ? 0 : 420); return;}
      inboxTimer = setTimeout(() => {
        $('inbox-status').textContent = 'Нужно подтверждение'; $('inbox-status').classList.add('done');
        $('inbox-result').innerHTML = `<div class="result-summary"><h4>${item.title}</h4><span class="badge ${item.warning?'warn':''}">${item.badge}</span></div><div class="data-grid">${item.fields.map(([label,value]) => `<div><small>${label}</small><span>${value}</span></div>`).join('')}</div><p class="result-note"><strong>Контроль человека.</strong> ${item.note}</p><button class="small-button" id="approve-inbox">${item.action}</button>`;
        $('approve-inbox').addEventListener('click', () => {
          $('approve-inbox').outerHTML = `<p class="simulated-success" role="status">✓ ${item.success}</p>`;
          $('inbox-status').textContent = 'Демо завершено';
        });
        $('run-inbox').disabled = false; $('run-inbox').innerHTML = 'Повторить сценарий <span>↻</span>';
      }, reduceMotion ? 0 : 350);
    }
    steps.forEach(node => node.classList.remove('active'));step(0);
  });
  function resetMeeting() {
    $('meeting-message').textContent = meetings[$('meeting-case').value].message;
    $('meeting-status').textContent = 'Ожидает запуска';$('meeting-status').classList.remove('done');
    $('meeting-result').innerHTML = emptyResult('≡','Разговор заканчивается.<br>Договорённости остаются.','Выберите пример и соберите план.');
  }
  $('meeting-case').addEventListener('change', resetMeeting);
  $('run-meeting').addEventListener('click', () => {
    const meeting = meetings[$('meeting-case').value];
    $('meeting-status').textContent = 'Черновик для проверки';$('meeting-status').classList.add('done');
    $('meeting-result').innerHTML = `<div class="result-summary"><h4>План после встречи</h4><span class="badge">3 пункта</span></div><ul class="task-list">${meeting.tasks.map(([task,detail],index) => `<li><span>${index+1}</span><div>${task}<small>${detail}</small></div></li>`).join('')}</ul><p class="result-note"><strong>Открытые вопросы.</strong> ${meeting.question}</p><p class="micro">ЧЕРНОВИК · ЗАДАЧИ НЕ ОТПРАВЛЕНЫ В СЕРВИСЫ</p>`;
  });
  function resetPrompt() {
    $('prompt-message').textContent = prompts[$('prompt-mode').value];
    $('prompt-status').textContent = 'Ожидает запуска';$('prompt-status').classList.remove('done');
    $('prompt-result').innerHTML = emptyResult('[ ]','Контекст и границы<br>меняют результат.','Сравните два заранее подготовленных ответа.');
  }
  $('prompt-mode').addEventListener('change', resetPrompt);
  $('run-prompt').addEventListener('click', () => {
    const structured = $('prompt-mode').value === 'structured';
    $('prompt-status').textContent = 'Подготовленный пример';$('prompt-status').classList.add('done');
    $('prompt-result').innerHTML = structured
      ? `<div class="result-summary"><h4>Сначала — контекст</h4><span class="badge">Есть границы</span></div><div class="result-answer">Стоимость зависит от процесса. Чтобы подготовить оценку, уточните:<br>1. Откуда приходят заявки?<br>2. Куда их нужно передавать?<br>3. Какие действия должны подтверждаться человеком?<br><br>После этого разработчик сможет оценить объём и этапы.</div><div class="quality-list"><span>✓ Роль</span><span>✓ Контекст</span><span>✓ Формат</span><span>✓ Граница ответственности</span></div><p class="result-note">Инструкция задаёт проверяемое поведение. В рабочей системе его дополнительно проверяют на наборе примеров.</p>`
      : `<div class="result-summary"><h4>Слишком много свободы</h4><span class="badge warn">Нет критериев</span></div><div class="result-answer">«Автоматизация помогает быстрее обрабатывать заявки. Можно связать ваши сервисы и настроить нужные действия. Расскажите подробнее о задаче».</div><p class="result-note">Ответ может звучать уместно, но инструкция не определяет, какие сведения уточнить, чего не обещать и кому передать оценку.</p><button class="small-button" id="compare-prompt">Добавить контекст и правила →</button>`;
    if (!structured) $('compare-prompt').addEventListener('click', () => {$('prompt-mode').value='structured';resetPrompt();$('run-prompt').click();});
  });
  $('brief-form').addEventListener('submit', event => {
    event.preventDefault();
    const task = $('brief-task').value.trim();
    if (task.length < 15) {$('brief-task').setCustomValidity('Опишите задачу чуть подробнее: не менее 15 символов.');$('brief-task').reportValidity();return;}
    $('brief-task').setCustomValidity('');
    activeBrief = `Бриф для Ленара\n\nЧто нужно: ${$('brief-type').value}.\nГде идёт работа: ${$('brief-source').value}.\n\nЗадача и ожидаемый результат:\n${task}\n\nКонтроль действий: ${$('brief-review').checked?'нужно подтверждение человека':'границы автономности обсудим отдельно'}.\n\nНа первом обсуждении уточним примеры данных, интеграции, ограничения, сроки и бюджет.`;
    if (campaignTags.length) activeBrief += `\n\nМетки источника: ${campaignTags.join(', ')}.`;
    $('brief-preview').textContent = activeBrief;$('brief-result').hidden=false;$('copy-status').textContent='';
  });
  $('brief-task').addEventListener('input', () => $('brief-task').setCustomValidity(''));
  ['brief-type','brief-source','brief-task','brief-review'].forEach(id => $(id).addEventListener('input', () => {activeBrief='';$('brief-result').hidden=true;}));
  $('copy-brief').addEventListener('click', async () => {
    try {await navigator.clipboard.writeText(activeBrief);$('copy-status').textContent='Скопировано. Вставьте бриф в сообщение Ленару.';}
    catch {$('copy-status').textContent='Браузер не разрешил копирование. Выделите текст брифа вручную или скачайте файл.';}
  });
  $('download-brief').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([activeBrief],{type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a');link.href=url;link.download='brief-dlya-lenara.txt';link.click();setTimeout(() => URL.revokeObjectURL(url),1000);
  });
  resetInbox();resetMeeting();resetPrompt();
})();
