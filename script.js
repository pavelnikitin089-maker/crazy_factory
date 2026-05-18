const rollBtn = document.getElementById('roll-btn');
const restartBtn = document.getElementById('restart-btn');
const statusText = document.getElementById('status');
const setupArea = document.getElementById('setup-area');
const actionArea = document.getElementById('action-area');
const tokensLayer = document.getElementById('tokens-layer');
const historyLog = document.getElementById('history-log'); // Лог ходов возвращен на место!
const diceCountSelect = document.getElementById('dice-count-select');
const difficultySelect = document.getElementById('difficulty-select');

let players = []; 
let currentTurn = 0; 
const totalCells = 66;
let isAnimating = false; 

// ==========================================================================
// ⚠️ ВСТАВЬ СЮДА СВОИ НАСТРОЕННЫЕ ЛОКАЛЬНЫЕ КООРДИНАТЫ КЛЕТОК!
// ==========================================================================
const BOARD_COORDINATES = {
    0:  { x: 80, y: 93 },  // СТАРТ
    1:  { x: 91, y: 89 },  
    2:  { x: 85, y: 76 },  
    3:  { x: 82.9, y: 82.5 },  
    4:  { x: 70.5, y: 84.5 },  
    5:  { x: 63.1, y: 87.9 },  
    6:  { x: 63.5, y: 76.9 },  
    7:  { x: 71.5, y: 76 },  
    8:  { x: 78, y: 76 },  
    9:  { x: 83, y: 66 },  
    10: { x: 76, y: 67.7 },  
    11: { x: 63, y: 69 },  
    12: { x: 60, y: 74 },  
    13: { x: 54, y: 79 },  
    14: { x: 44.1, y: 85 },  
    15: { x: 37, y: 86.6 },  
    16: { x: 29, y: 85 },  17: { x: 19.9, y: 83.9 },  18: { x: 13, y: 81 },  
    19: { x: 16.5, y: 72.5 },  20: { x: 22.2, y: 74.5 },  21: { x: 23.9, y: 61.9 },  
    22: { x: 29.1, y: 70.1 },  23: { x: 37.5, y: 67.5},  24: { x: 43.1, y: 66 },  
    25: { x: 49, y: 64 },  26: { x: 55.5, y: 65.5 },  27: { x: 66.1, y: 59.2 },  
    28: { x: 75, y: 58.2 },  
    29: { x: 80.8, y: 56.5 },  30: { x: 80.8, y: 36.5 },  31: { x: 76.9, y: 38.8 },  
    32: { x: 76, y: 50.9 },  
    33: { x: 69.5, y: 50.5 },  34: { x: 63.5, y: 48.8 },  35: { x: 58.5, y: 50.1 },  
    36: { x: 51.3, y: 52.5 },  37: { x: 41.2, y: 44.8 },  38: { x: 34, y: 41.1 },  
    39: { x: 29.5, y: 47.1 },  
    40: { x: 13,  y: 43 },  41: { x: 13.2,  y: 26.5 },  42: { x: 31.5, y: 31.5 },  
    43: { x: 37, y: 29.9 },  44: { x: 43.1, y: 29.1 },  45: { x: 45, y: 39.5 },  
    46: { x: 48.8, y: 39.5 },  
    47: { x: 55.2, y: 41.9 },  48: { x: 63.5, y: 39.1 },  49: { x: 70, y: 40 },  
    50: { x: 77.7, y: 31 },  51: { x: 69.5, y: 27.1 },  52: { x: 64.1, y: 26 },  
    53: { x: 59, y: 25.3 },  54: { x: 55, y: 26 },  55: { x: 51.1, y: 19.5 },  
    56: { x: 46.1, y: 17.9 },  57: { x: 36, y: 19.7 },  58: { x: 34.5, y: 18.7 },  
    59: { x: 28.5, y: 19.1 },  
    60: { x: 21, y: 15 },  
    61: { x: 31, y: 10 },  62: { x: 36.9, y: 10.8 },  63: { x: 46.6, y: 10.5 },  
    64: { x: 56.1, y: 11.3 },  65: { x: 61, y: 10.1 },  66: { x: 77.7, y: 6.66 }   
};

// НАСТРОЙКА КЛЕТОК-ЛОВУШЕК И СПЕЦ-ЗОН
const CELL_RULES = {
    // Телепорты / Падения (targetCell - куда конкретно летит игрок)
    12: { type: 'teleport', targetCell: 0, message: '⚙️ Клетка 12: Вы сорвались под колеса! Возврат на СТАРТ.' },
    23: { type: 'teleport', targetCell: 15, message: '📉 Клетка 23: Падение механизма! Откат на клетку 15.' },
    34: { type: 'teleport', targetCell: 26, message: '⚠️ Клетка 34: Конвейер дал сбой! Откат на клетку 26.' },
    48: { type: 'teleport', targetCell: 33, message: '🏭 Клетка 48: Сброс отходов! Спуск на клетку 33.' },
    56: { type: 'teleport', targetCell: 44, message: '🛠️ Клетка 56: Технический спуск на клетку 44.' },
    
    // Ловушки пропуска хода (skipTurns: 1)
    18: { type: 'trap', skipTurns: 1, message: '⏳ Клетка 18: Засор шестеренок! Пропуск 1 хода.' },
    37: { type: 'trap', skipTurns: 1, message: '🛑 Клетка 37: Экстренная остановка линии! Пропуск 1 хода.' },
    60: { type: 'trap', skipTurns: 1, message: '🧪 Клетка 60: Токсичные испарения зеленой зоны! Пропуск 1 хода.' },
    
    // НАЧАЛО ВСТАВКИ: Описание новых спец-зон
    29: { type: 'trap', skipTurns: 1, message: '📦 Клетка 29: Вентиляционная шахта! Пропуск 1 хода, далее выход только по нечетным!' },
    30: { type: 'trap', skipTurns: 1, message: '📦 Клетка 30: Вентиляционная шахта! Пропуск 1 хода, далее выход только по нечетным!' },
    40: { type: 'trap', skipTurns: 1, message: '🌪️ Клетка 40: Сортировочный отсек! Пропуск 1 хода, далее четные сдувают назад!' }
    // КОНЕЦ ВСТАВКИ
};

function getCoords(cellNum) {
    if (BOARD_COORDINATES[cellNum]) {
        return BOARD_COORDINATES[cellNum];
    }
    return { x: 50, y: 50 }; 
}

window.startGame = function(count) {
    players = [];
    if (historyLog) historyLog.innerHTML = ''; // Очищаем историю ходов
    // Возвращаем кнопки в исходное состояние
    rollBtn.style.display = 'inline-block';
    rollBtn.disabled = false;
    if (restartBtn) restartBtn.style.display = 'none';
    // ... (весь остальной твой код функции startGame без изменений)
    for (let i = 0; i < count; i++) {
        players.push({ 
            id: i + 1, 
            position: 0, 
            isFinished: false,
            skipTurnsLeft: 0 
        });
    }
    currentTurn = 0;
    setupArea.style.display = 'none';
    actionArea.style.display = 'inline-block';
    
    addLogEntry('⚙️ Игра начата! Все игроки на Старте.');
    drawPlayers();
    updateStatus();
};

function drawPlayers() {
    tokensLayer.innerHTML = ''; 

    players.forEach(player => {
        const coords = getCoords(player.position);
        const token = document.createElement('div');
        token.classList.add('token', `p${player.id}`);
        
        const shiftX = (player.id - 1) * 1.2 - ((players.length - 1) * 0.6);
        const shiftY = (player.id - 1) * 1.2 - ((players.length - 1) * 0.6);
        
        token.style.left = `${coords.x + shiftX}%`;
        token.style.top = `${coords.y + shiftY}%`;
        
        tokensLayer.appendChild(token);
    });
}

// Функция логов (Успешно возвращена!)
function addLogEntry(text, playerId = null) {
    if (!historyLog) return;
    const entry = document.createElement('div');
    entry.classList.add('log-entry');
    if (playerId) {
        entry.style.borderLeftColor = getPlayerColor(playerId);
    }
    entry.innerHTML = text;
    historyLog.appendChild(entry);
    historyLog.scrollTop = historyLog.scrollHeight;
}

function updateStatus() {
    const currentPlayer = players[currentTurn];
    
    if (currentPlayer.skipTurnsLeft > 0) {
        const rule = CELL_RULES[currentPlayer.position];
        const trapMessage = rule ? rule.message : `пропускает ход`;

        statusText.innerHTML = `😴 <span style="color: ${getPlayerColor(currentPlayer.id)}">Игрок ${currentPlayer.id}</span>: ${trapMessage} (Осталось: ${currentPlayer.skipTurnsLeft})`;
        
        rollBtn.disabled = true;
        
        setTimeout(() => {
            currentPlayer.skipTurnsLeft--;
            nextTurn();
        }, 1500);
        return;
    }
    
    // ПРОВЕРКА НА ИНТЕРАКТИВНЫЕ СВЕРХ-СПЕЦИАЛЬНЫЕ ЗОНЫ ПРИ СТАРТЕ ХОДА
    if (currentPlayer.position === 29 || currentPlayer.position === 30) {
        rollBtn.disabled = true; // Выключаем главную кнопку на панели
        statusText.innerHTML = `📦 Игрок ${currentPlayer.id} находится в Вент. шахте!`;
        
        const rulesDescription = `<b>Игрок ${currentPlayer.id} застрял в Вент. шахте (клетка ${currentPlayer.position})!</b><br><br>• Чтобы конвейер выпустил вас, нужно выбросить <b>НЕЧЁТНОЕ</b> число на одном кубике.<br>• Если выпадает ЧЁТНОЕ — вы остаетесь внутри до следующего хода.`;
        
        showGameModal('📦', 'ВЕНТ ШАХТА', rulesDescription, null, true, () => {
            const modalRollBtn = document.getElementById('modal-roll-btn');
            
            // Включаем анимацию кручения прямо на панели за модалкой
            animateDiceRoll(1, (individualRolls, specialRoll) => {
                const isOdd = (specialRoll % 2 !== 0);
                
                if (isOdd) {
                    let newPosition = currentPlayer.position + specialRoll;
                    if (newPosition > totalCells) newPosition = totalCells;
                    
                    showGameModal('🎉', 'УСПЕШНЫЙ ВЫХОД!', `Выброшено число: <b>${specialRoll}</b> (Нечётное)! Вы успешно покидаете Вент. шахту.`, () => {
                        addLogEntry(`📦 Игрок ${currentPlayer.id} выбросил нечетное (${specialRoll}) и выбрался из Вент. шахты ➡️ ${newPosition}`, currentPlayer.id);
                        animateMovement(currentPlayer, newPosition, () => { checkCellRules(currentPlayer, specialRoll); });
                    });
                } else {
                    showGameModal('⏳ ОСТАЕТЕСЬ В ШАХТЕ', 'НЕПОВЕЗЛО!', `Выброшено число: <b>${specialRoll}</b> (Чётное). Конвейер заблокирован, вы остаетесь здесь.`, () => {
                        addLogEntry(`⏳ Игрок ${currentPlayer.id} выбросил чётное (${specialRoll}) и остается в шахте (клетка ${currentPlayer.position})`, currentPlayer.id);
                        nextTurn();
                    });
                }
            });
        });
        return;
    }

    if (currentPlayer.position === 40) {
        rollBtn.disabled = true;
        statusText.innerHTML = `🌪️ Игрок ${currentPlayer.id} на станции Сортировки!`;
        
        const rulesDescription = `<b>Вы попали на Сортировку (клетка 40)!</b><br><br>• Требуется выбросить <b>НЕЧЁТНОЕ</b> число, чтобы продвинуться вперед.<br>• Осторожно! Если выпадает <b>ЧЁТНОЕ</b> — выс отбракуют, вы вернетесь <b>назад на клетку 21</b>!`;
        
        showGameModal('🌪️', 'Станции Сортировки', rulesDescription, null, true, () => {
            const specialRoll = Math.floor(Math.random() * 6) + 1;
            const isOdd = (specialRoll % 2 !== 0);
            
            if (isOdd) {
                let newPosition = currentPlayer.position + specialRoll;
                if (newPosition > totalCells) newPosition = totalCells;
                
                showGameModal('🚀 NICE!', 'ОТЛИЧНЫЙ БРОСОК', `Выброшено число: <b>${specialRoll}</b> (Нечётное)! Ваше качетсво подтверждено!`, () => {
                    addLogEntry(`🌪️ Игрок ${currentPlayer.id} прорвался через Сортировку и двигается дальше. (${specialRoll}) ➡️ ${newPosition}`, currentPlayer.id);
                    animateMovement(currentPlayer, newPosition, () => { checkCellRules(currentPlayer, specialRoll); });
                });
            } else {
                showGameModal('💥 ОТБРАКОВКА!', 'NON CONDITION!', `Выброшено число: <b>${specialRoll}</b> (Чётное). Вас забраковали и вы возвращаетесь назад на клетку 21!`, () => {
                    addLogEntry(`💥 Игрок ${currentPlayer.id} не качественный. (Выпало ${specialRoll})! Откат 40 ➡️ 21`, currentPlayer.id);
                    currentPlayer.position = 21;
                    drawPlayers();
                    setTimeout(() => { nextTurn(); }, 600);
                });
            }
        });
        return;
    }

    // Если игрок на обычной клетке — включаем стандартную кнопку броска на панели
    rollBtn.disabled = false;
    statusText.innerHTML = `Ход <span style="color: ${getPlayerColor(currentPlayer.id)}"><b>Игрока ${currentPlayer.id}</b></span> (Клетка: ${currentPlayer.position}). Бросайте кубик!`;
}

function getPlayerColor(id) {
    if (id === 1) return '#ff3b30';
    if (id === 2) return '#007aff';
    return '#4cd964';
}

// НОВАЯ ПЛАВНАЯ СКОЛЬЗЯЩАЯ АНИМАЦИЯ
function animateMovement(player, targetPosition, callback) {
    if (player.position === targetPosition) {
        callback();
        return;
    }

    isAnimating = true;
    rollBtn.disabled = true;

    const step = player.position < targetPosition ? 1 : -1;
    
    // Функция делает один шаг и красиво дожидается окончания CSS-перехода фишки
    function doSingleStep() {
        if (player.position === targetPosition) {
            isAnimating = false;
            callback();
            return;
        }
        player.position += step;
        drawPlayers();
        
        // Каждая клетка плавно пробегается за 150 миллисекунд
        setTimeout(doSingleStep, 120); 
    }
    
    doSingleStep();
}

rollBtn.addEventListener('click', () => {
    if (isAnimating) return;
    
    let currentPlayer = players[currentTurn];
    if (currentPlayer.isFinished) { nextTurn(); return; }

    const diceCount = parseInt(diceCountSelect.value, 10);

    // Запускаем анимацию кручения
    animateDiceRoll(diceCount, (individualRolls, dice) => {
        const diceLogText = individualRolls.join(' + ');
        const fullDiceReport = diceCount > 1 ? `${dice} (${diceLogText})` : `${dice}`;

        // ПРОВЕРКА НА КРИТИЧЕСКУЮ СМЕРТЬ (Твой алгоритм)
        const difficulty = difficultySelect ? difficultySelect.value : 'normal';
        let isInstantDeath = false;
        let deathMessage = '';

        if (difficulty === 'hard') {
            if (individualRolls.includes(6)) {
                isInstantDeath = true;
                deathMessage = `💀 КРИТ-ОШИБКА! Выпала шестерка в режиме ХАРДКОР! Срыв в жерло фабрики, возврат на СТАРТ!`;
            }
        } else if (difficulty === 'normal') {
            if (diceCount === 2 && individualRolls[0] === 6 && individualRolls[1] === 6) {
                isInstantDeath = true;
                deathMessage = `💀 КАТАСТРОФА! Дубль шестерок (6 + 6)! Фишка уничтожена прессом, возврат на СТАРТ!`;
            }
        }

        if (isInstantDeath) {
            addLogEntry(`💀 Игрок ${currentPlayer.id} выбросил критическую шестерку и погиб! Откат на СТАРТ.`, currentPlayer.id);
            showGameModal('💀', 'КРИТ-ОШИБКА!', deathMessage, () => {
                currentPlayer.position = 0; 
                drawPlayers(); 
                setTimeout(() => { nextTurn(); }, 600);
            });
            return; 
        }

        // ОБЫЧНЫЙ ХОД
        const oldPos = currentPlayer.position;
        let newPosition = currentPlayer.position + dice;
        if (newPosition > totalCells) newPosition = totalCells;

        statusText.innerHTML = `🎲 <span style="color: ${getPlayerColor(currentPlayer.id)}">Игрок ${currentPlayer.id}</span> выбросил: <b>${fullDiceReport}</b>.`;
        addLogEntry(`🎲 Игрок ${currentPlayer.id}: выбросил ${fullDiceReport} и переходит ${oldPos} ➡️ ${newPosition}`, currentPlayer.id);

        animateMovement(currentPlayer, newPosition, () => {
            checkCellRules(currentPlayer, dice);
        });
    });
});

function checkCellRules(player, lastDiceRoll) {
    const difficulty = difficultySelect.value;
    const rule = CELL_RULES[player.position];

    if (difficulty === 'easy' && rule && rule.type !== 'finish_rule') {
        proceedToNextTurn();
        return;
    }

    if (rule) {
        if (rule.type === 'teleport') {
            let finalTarget = rule.targetCell; 
            
            // Проверяем хардкорный режим для откатов назад
            if (difficulty === 'hard' && finalTarget < player.position) {
                const normalOtkat = player.position - finalTarget;
                finalTarget = player.position - (normalOtkat);
            }

            if (finalTarget < 0) finalTarget = 0;
            if (finalTarget > totalCells) finalTarget = totalCells;

            // Показываем модальное окно. Телепортация начнется после клика на кнопку модалки
            showGameModal('💥', 'U SHALL NOT PASS!', rule.message, () => {
                addLogEntry(`⚙️ Спец-зона: ${rule.message}`, player.id);
                
                // 1. Находим текущий DOM-элемент фишки игрока
                const tokenElement = document.querySelector(`.token.p${player.id}`);
                
                if (tokenElement) {
                    isAnimating = true;
                    rollBtn.disabled = true;

                    // Задаем CSS-плавность для прозрачности
                    tokenElement.style.transition = 'opacity 0.4s ease-in-out';
                    // Растворяем фишку на старом месте
                    tokenElement.style.opacity = '0';
                    
                    // 2. Ждем 400мс, пока фишка полностью исчезнет
                    setTimeout(() => {
                        player.position = finalTarget; // Меняем позицию в памяти игры
                        drawPlayers();                 // Перерисовываем фишку (она создается заново)
                        
                        // Находим фишку уже на НОВОМ месте
                        const newTokenElement = document.querySelector(`.token.p${player.id}`);
                        if (newTokenElement) {
                            // Сразу гасим её прозрачность в 0, чтобы скрыть мгновенное появление
                            newTokenElement.style.opacity = '0';
                            newTokenElement.style.transition = 'opacity 0.4s ease-in-out';
                            
                            // На следующем кадре запускаем плавное проявление (материализацию)
                            requestAnimationFrame(() => {
                                newTokenElement.style.opacity = '1';
                            });
                        }
                        
                        // 3. Ждем окончания материализации и передаем ход
                        setTimeout(() => {
                            isAnimating = false;
                            proceedToNextTurn();
                        }, 400);

                    }, 400);
                } else {
                    // Если вдруг элемент фишки не найден, делаем мгновенный перенос без анимации
                    player.position = finalTarget;
                    drawPlayers();
                    setTimeout(proceedToNextTurn, 400);
                }
            });
            return;
        }

        if (rule.type === 'trap') {
            player.skipTurnsLeft = rule.skipTurns;
            statusText.innerHTML = rule.message;
            addLogEntry(`⚠️ Ловушка: Игрок ${player.id} попал на клетку ${player.position} и теряет ход.`, player.id);
            setTimeout(proceedToNextTurn, 1500);
            return;
        }

        if (rule.type === 'finish_rule') {
            if (lastDiceRoll === 6) {
                statusText.innerHTML = `💀 Выпало 6! Авария на фабрике, возврат на СТАРТ!`;
                addLogEntry(`💀 Клетка 66: Игрок ${player.id} выбросил 6 и разбился! Возврат на СТАРТ.`, player.id);
                setTimeout(() => {
                    animateMovement(player, 0, () => {
                        proceedToNextTurn();
                    });
                }, 1800);
            } else {
                player.isFinished = true;
                statusText.innerHTML = `🏁 🎉 Игрок ${player.id} победил, дойдя до ФИНИША!`;
                addLogEntry(`🎉 🏆 <b>Игрок ${player.id} успешно ФИНИШИРОВАЛ и завершил игру!</b>`, player.id);
                setTimeout(proceedToNextTurn, 2000);
            }
            return;
        }
    }

    if (player.position >= totalCells) {
        player.isFinished = true;
        statusText.innerHTML = `🏁 Игрок ${player.id} на ФИНИШЕ!`;
        addLogEntry(`🏁 Игрок ${player.id} закончил игру!`, player.id);
    } else {
        statusText.innerHTML = `Игрок ${player.id} встал на клетку ${player.position}`;
    }

    setTimeout(proceedToNextTurn, 800);
}

function proceedToNextTurn() {
    if (players.every(p => p.isFinished)) {
        statusText.innerHTML = '🎉 Игра окончена! Все на финише.';
        addLogEntry('🏁 <b>Игра полностью завершена! Конец сессии.</b>');
        // Прячем кнопку броска и показываем кнопку "Начать заново"
        rollBtn.style.display = 'none'; 
        if (restartBtn) {
            restartBtn.style.display = 'inline-block';
        }
        return;
    }
    nextTurn();
}

function nextTurn() {
    do {
        currentTurn = (currentTurn + 1) % players.length;
    } while (players[currentTurn].isFinished && !players.every(p => p.isFinished));
    
    updateStatus();
}

document.querySelector('.board-wrapper').addEventListener('click', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    console.log(`Клик: { x: ${x}, y: ${y} }`);
});

// Функция для вызова красивого окна из любой части игры
let modalCallback = null; // Запоминаем, что делать ПОСЛЕ закрытия окна

// Улучшенная функция вызова окна
window.showGameModal = function(emoji, title, text, callback = null, isInteractiveZone = false, interactiveCallback = null) {
    document.getElementById('modal-icon').innerText = emoji;
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-text').innerHTML = text;
    
    const card = document.querySelector('.modal-card');
    const actionSpace = document.getElementById('modal-action-space');
    
    // Подстраиваем цвета
    if (emoji === '🎉' || emoji === '🏆') {
        card.style.borderColor = '#4cd964'; // Зеленый для победы
    } else if (emoji === '📦' || emoji === '🌪️') {
        card.style.borderColor = '#ff9500'; // Оранжевый/Желтый для интерактивных спец-зон
    } else {
        card.style.borderColor = '#ff3b30'; // Красный для аварий
    }

    // Если это спец-зона (29,30,40), создаем кнопку броска прямо внутри модалки!
    if (isInteractiveZone && interactiveCallback) {
        actionSpace.innerHTML = `<button id="modal-roll-btn" style="background: #ff9500; color: white; border: none; padding: 12px 30px; font-size: 16px; font-weight: bold; border-radius: 6px; cursor: pointer; box-shadow: 0 4px 10px rgba(255,149,0,0,4); transition: transform 0.1s;">🎲 БРОСИТЬ ОДИН КУБИК</button>`;
        
        const modalRollBtn = document.getElementById('modal-roll-btn');
        modalRollBtn.addEventListener('click', () => {
            modalRollBtn.disabled = true; // Защита от спама кликов
            interactiveCallback(); // Запускаем внутреннюю математику броска!
        });
    } else {
        // Обычное окно уведомления с кнопкой "ПОНЯТНО"
        const btnColor = (emoji === '🎉' || emoji === '🏆') ? '#4cd964' : '#ff3b30';
        actionSpace.innerHTML = `<button id="modal-close-btn" onclick="closeGameModal()" style="background: ${btnColor}; color: white; border: none; padding: 12px 30px; font-size: 16px; font-weight: bold; border-radius: 6px; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.2); transition: transform 0.1s;">ПОНЯТНО</button>`;
    }

    modalCallback = callback; 
    document.getElementById('game-modal').style.display = 'flex';
};

// Функция закрытия окна
window.closeGameModal = function() {
    document.getElementById('game-modal').style.display = 'none';
    if (modalCallback) {
        modalCallback(); 
    }
};
if (restartBtn) {
    restartBtn.addEventListener('click', () => {
        // Сбрасываем интерфейс и показываем меню выбора игроков
        actionArea.style.display = 'none';
        setupArea.style.display = 'block';
    });
}
// Универсальная функция для имитации вращения кубиков
function animateDiceRoll(diceCount, onComplete) {
    isAnimating = true;
    rollBtn.disabled = true;
    
    let counter = 0;
    // Крутим кубики 12 раз каждые 60 миллисекунд (эффект мерцания цифр)
    const interval = setInterval(() => {
        let fakeDice = [];
        for (let i = 0; i < diceCount; i++) {
            fakeDice.push(Math.floor(Math.random() * 6) + 1);
        }
        statusText.innerHTML = `🎲 Кубики крутятся: <b style="color: #ff9500">${fakeDice.join(' + ')}</b>...`;
        counter++;
        
        if (counter >= 12) {
            clearInterval(interval);
            isAnimating = false;
            
            // Генерируем реальный финальный результат
            let finalRolls = [];
            let total = 0;
            for (let i = 0; i < diceCount; i++) {
                const roll = Math.floor(Math.random() * 6) + 1;
                finalRolls.push(roll);
                total += roll;
            }
            
            // Передаем массив выпавших костей и сумму в итоговую логику
            onComplete(finalRolls, total);
        }
    }, 600 / 10);
}