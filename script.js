/*
 * Global variables
 */
var bugList = [];           // A list of all bug objects
var foodList = [];          // A list of all food objects
var level = 1;              // Current level
var score = 0;              // Current score
var time = 61;              // Time count
var foodNum = 5;            // The number of foods available
var frameNum = 0;           // Counter for the number of frames
var frameInterval = 33.33;  // Refresh rate (in ms)
var FRAMES_PER_SEC = 30;    // Frames per second
var isPause = false;        // Flag indicates if the game has paused
var isRestart = false;      // Flag indicates if the game is restarted
var isNewLevel = false;     /* Flag indicates if the game goes to a new
                               level automatically */
var isSecondTime = false;   // Flag indicates if the game has been played twice
var reloadInterval;         // Run reload function at given refresh rate
var bugCreateTimeout;       // Create a bug at given Timeout

// Colors
var RED = "#FF0000";
var BLACK = "#000000";
var WHITE = "#FFFFFF";
var ORANGE = "#FF8000";
var BACKGROUND_GAME = "#4CC3D9";
var BACKGROUND_START = "#FFC65D";
var BACKGROUND_LEVEL = "#F16745";
var BACKGROUND_TOOLBAR = "#F4AC42";

// Strings
var TEXT_NONE = "none";
var TEXT_BLOCK = "block";
var TEXT_TIME = "Time: ";
var TEXT_LEVEL = "Level ";
var TEXT_SCORE = "Score: ";
var TEXT_YOUR_SCORE = "Your Score : ";
var TEXT_GAME_OVER = "Game Over : (";
var TEXT_NOT_PLAYED = "Not Played Yet";
var TEXT_MISSION_COMPLETE = "Mission Complete ~";
var FONT_LEVEL = "32px Cabin, Verdana, Geneva, sans-serif";
var FONT_TIME_SCORE = "25px Cabin, Verdana, Geneva, sans-serif";

// HTML elements
var body = document.body;
var img = document.getElementById("food");
var canvas = document.getElementById("game");
var title = document.getElementById("end_title");
var endPage = document.getElementById("end_page");
var highOne = document.getElementById("high_one");
var highTwo = document.getElementById("high_two");
var mainGame = document.getElementById("main_game");
var lOneRadio = document.getElementById("level_one");
var lTwoRadio = document.getElementById("level_two");
var yourScore = document.getElementById("your_score");
var startPage = document.getElementById("start_page");
var restartButton = document.getElementById("restart_button");

// Canvas context
var context = canvas.getContext("2d");


/*
 *  Assigns restartGame funciton to the click event of the "restart" button
 */
restartButton.onclick = function () {
    restartGame(level);
}


/*
 *  Restores highest score for selected level from local storage
 *  to HTML element. Called immediately after site loaded
 */
function restoreScore() {

    // If the radio button for level one is checked, show the
    // high score for level one
    if (lOneRadio.checked) {

        // Hide level two score and show level one score
        highOne.style.display = TEXT_BLOCK;
        highTwo.style.display = TEXT_NONE;

        // If there is no score stored in local storage, then show
        // "Not Yet Played"
        if (localStorage.getItem("highscoreOne") === null) {
            highOne.innerHTML = TEXT_NOT_PLAYED;
        } else {
            highOne.innerHTML = localStorage.getItem("highscoreOne");
        }

    // Same for level two being selected
    } else if (lTwoRadio.checked) {

        highTwo.style.display = TEXT_BLOCK;
        highOne.style.display = TEXT_NONE;

        if (localStorage.getItem("highscoreTwo") === null) {
            highTwo.innerHTML = TEXT_NOT_PLAYED;
        } else {
            highTwo.innerHTML = localStorage.getItem("highscoreTwo");
        }

    }
}


/*
 *  Starts the game. Called when user clicks on the "Start" button
 */
function startGame() {

    // If it is a new game, decide the level based on the choice
    // of radio button
    if (!isRestart || isSecondTime) {
        if (lOneRadio.checked)
            level = 1;
        else if (lTwoRadio.checked)
            level = 2;
    }

    // If it is the second round, mark it as first-time playing and
    // restart the game from current selected level
    if (isSecondTime) {
        isSecondTime = false;
        restartGame(level);
        return;
    }

    // Draws the toolbar on top of the playground
    context.fillStyle = BACKGROUND_TOOLBAR;
    context.fillRect(0, 0, 400, 100);

    // Hides the start page and show the main page. Changes the
    // background color of the game page
    endPage.style.display = TEXT_NONE;
    startPage.style.display = TEXT_NONE;
    mainGame.style.display = TEXT_BLOCK;
    body.style.background = BACKGROUND_GAME;

    // If user restarts the game, no need to create another timeout
    // to create bugs
    if (!isRestart) {
        reloadInterval = setInterval(reload, frameInterval);
        bugCreateTimeout = timeFunc();
    } else {
        clearInterval(reloadInterval);
        reloadInterval = setInterval(reload, frameInterval);
    }

    // Adds mousedown events to pause and kill bugs
    canvas.addEventListener("mousedown", getPosition, false);
    canvas.addEventListener("mousedown", checkIsPause, false);

    // Initiates the game
    initiate();
}


/*
 *  Initiates the game
 */
function initiate() {
    // Draws the pause buton on the toolbar
    drawPause();

    // Creates the first bug on playground
    if (!isSecondTime)
        bugCreate();

    // Creates the foods
    foodCreate();
}


/*
 *  Restarts the game at specific level lvl
 */
function restartGame(lvl) {
    // Restores default values to global variables and marks isRestart
    // as true
    level = lvl;
    bugList = [];
    foodList = [];

    time = 61;
    score = 0;
    frameNum = 0;
    isPause = false;
    isRestart = true;

    // Starts the game
    startGame();
}


/*
 *  Draws a single frame. Called every time when the frame is refreshed
 */
function reload() {

    // If the frame number reaches the frame rate, then one second has
    // passed, so decrese the time by one
    if (frameNum % FRAMES_PER_SEC == 0) {
        time--;
    }

    // Increses the frame number every time when the funciton is called
    frameNum++;

    // Clears the whole playground except the toolbar and redraws everything
    context.clearRect(0, 100, 400, 700);

    // Updates the status of bugs
    updateBugs();

    // Redraws all bugs
    drawBugs();

    // Redraws all foods
    drawFoods();

    // Redraws the time conter on the toolbar
    drawTime();

    // Redraws the score conter on the toolbar
    drawScore();

    // Redraws the level indicator on the toolbar
    drawLevel();

    // Checks if the game is done
    checkGameOver();
}


/*
 *  Draws the level number on the toolbar
 */
function drawLevel() {
    // Draws text on the lower half of the toolbar
    context.fillStyle = BACKGROUND_LEVEL;
    context.fillRect(0, 50, 400, 50);
    context.beginPath();

    context.fillStyle = WHITE;
    context.font = FONT_LEVEL;
    var levelText = TEXT_LEVEL + level;
    context.fillText(levelText, 160, 85);
}


/*
 *  Draws the time counter on the toolbar
 */
function drawTime() {
    context.fillStyle = BACKGROUND_TOOLBAR;
    context.fillRect(0, 0, 150, 50);
    context.beginPath();

    if (time <= 10) {
        context.fillStyle = RED;
    } else {
        context.fillStyle = WHITE;
    }

    context.font = FONT_TIME_SCORE;
    var timeText = TEXT_TIME + time;
    context.fillText(timeText, 30, 34);
}


/*
 *  Draws the score counter on the toolbar
 */
function drawScore() {
    context.fillStyle = BACKGROUND_TOOLBAR;
    context.fillRect(270, 0, 150, 50);
    context.beginPath();

    context.fillStyle = WHITE;
    context.font = FONT_TIME_SCORE;
    var scoreText = TEXT_SCORE + score;
    context.fillText(scoreText, 270, 34);
}


/*
 *  Draws the pause button on canvas
 */
function drawPause() {
    context.fillStyle = BACKGROUND_TOOLBAR;
    context.fillRect(170, 0, 100, 50);
    context.beginPath();

    context.fillStyle = WHITE;
    context.rect(192.5, 15, 5, 20);
    context.fill();

    context.rect(202.5, 15, 5.5, 20);
    context.fill();
}


/*
 *  Draws the resume button on canvas
 */
function drawResume() {
    context.fillStyle = BACKGROUND_TOOLBAR;
    context.fillRect(170, 0, 100, 50);
    context.beginPath();

    context.fillStyle = WHITE;
    context.moveTo(210, 25);
    context.lineTo(190, 13);
    context.lineTo(190, 38);
    context.fill();
    context.closePath();
}


/*
 *  The constructor of a single bug object
 */
function BugConstructor(x, y, type, speed) {
    // The position coordinates of a bug
    this.x = x;
    this.y = y;

    this.goal = null;           // The index of the goal food of this bug
    this.alpha = 1.0;           // The opacity of this bug
    this.type = type;           // The color of this bug
    this.speed = speed;         // The speed of this bug
    this.status = true;         // The status, false if the bug has been killed
    this.direction_x = 0;       // The x and y coordinates of the goal
    this.direction_y = 0;
    this.collision = false;     /* Flag indicates if the bug has a collision
                                   bug with it */
    this.waitingBug = null;     // The collision bug that this bug is waiting for
}


/*
 *  Creates a single bug object and adds it to the bug list
 */
function bugCreate() {
    var x, y, bugProbability;
    var type
    var speed;

    bugProbability = getRandomInt(1, 100);

    // Constructs different bugs according to different probabilities
    if (bugProbability <= 30) {
        type = BLACK;
        speed = (level == 1) ? 150 : 200;
    } else if (bugProbability <= 60) {
        type = RED;
        speed = (level == 1) ? 75 : 100;
    } else {
        type = ORANGE;
        speed = (level == 1) ? 60 : 80;
    }

    // The initial coordinates of the bug
    y = 105;
    x = getRandomInt(10, 390);

    // Constructs the bug object and adds it to bugList
    bugList.push(new BugConstructor(x, y, type, speed));

    // Draws all the bugs in bugList
    drawBugs();
}


/*
 *  Draw all bugs in bugList if the bug is not killed or is killed but
 *  still fading out
 */
function drawBugs() {
    for (var key in bugList) {
        if (bugList[key].status || bugList[key].alpha > 0.1) {
            drawBug(bugList[key]);
        }
    }
}


/*
 *  Calls makeBug to draw the actural bug on canvas. If a bug is
 *  killed, decrese its opacity untill it's disappeared.
 */
function drawBug(bug) {
    if (!bug.status) {
        bug.alpha -= 0.1;
    }
    makeBug(bug.x, bug.y, bug.type, bug.alpha);
}


/*
 *  Calls checkCollisionBugs and updateBug to update the
 *  status of all bugs in bugList
 */
function updateBugs() {
    // First checks collision for all bugs
    checkCollisionBugs();

    // Then updates the status of the bugs
    for (var key in bugList) {
        if (bugList[key].status)
            updateBug(bugList[key]);
    }
}


/*
 *  Updates the direction of movement of bug to lead it
 *  towards the nearest food
 */
function updateBug(bug) {

    // If the bug does not have a collision with other bugs
    // of the same type, updates its coordinates to make it
    // move at the next frame
    if (!bug.collision) {
        calculateGoal(bug);
        bug.x += bug.direction_x;
        bug.y += bug.direction_y;

    // Else do nothing, so the bug stays at
    // the original position
    } else {
        bug.x += 0;
        bug.y += 0;
    }
}


/*
 *  Checks and updates collision information of bugs and
 *  calls checkCollision
 */
function checkCollisionBugs() {
    for (var key in bugList) {
        if (bugList[key].status) {

            // If the bug current bug is waiting is killed, then mark
            // current bug as no collision and check new collision
            // fof the bug
            if (bugList[key].waitingBug != null &&
                    !bugList[key].waitingBug.status) {
                bugList[key].waitingBug = null;
                bugList[key].collision = false;
            }
            checkCollision(bugList[key]);

        // If the bug is killed, marks it as no collision
        } else
            bugList[key].collision = false;
    }
}


/*
 *  Checks collision between bug and all bugs in bugList
 */
function checkCollision(bug) {
    for (var key in bugList) {

        // If the bug in the list is itself or is killed, skip it
        if (bugList[key].status && bugList[key] != bug) {

            // Calculate the distance between current bug an the
            // bug being checked
            var dis = Math.sqrt((calRealXY(bugList[key]).x -
                        calRealXY(bug).x) * (calRealXY(bugList[key]).x -
                        calRealXY(bug).x) + (calRealXY(bugList[key]).y -
                        calRealXY(bug).y) * (calRealXY(bugList[key]).y -
                        calRealXY(bug).y));

            // If the distance between then is less than 20,
            // then collision happened
            if (dis < 20) {

                // If the current bug is slower, then move left if the
                // bug comes from right, move right if the bug comes
                // from left
                if (bug.speed < bugList[key].speed) {
                    if (bug.x < bugList[key].x)
                        bug.x -= 4.75;
                    else
                        bug.x += 4.75;

                // Do the opposite
                } else if (bugList[key].speed < bug.speed) {
                    if (bug.x < bugList[key].x)
                        bugList[key].x += 4.75;
                    else
                        bugList[key].x -= 4.75;
                }
            }

            // If two bugs are of the same speed
            if (bug.speed == bugList[key].speed) {

                // If the current bug has no waiting bug and the
                // distance is less than 20
                if (bug.waitingBug == null && dis < 20) {

                    // If the bug is to the right, make it the curent bug's
                    // waiting bug and mark it's collision as true
                    if (bug.x <= bugList[key].x) {
                        bug.waitingBug = bugList[key];
                        bugList[key].x += 1;
                        bug.collision == true;

                    // Do the opposite
                    } else {
                        bugList[key].waitingBug = bug;
                        bugList[key].collision = true;
                        bug.x += 1;
                    }

                // If the current bug already has a waiting bug, check there
                // distance, if it's more than 20, remove the bug from the
                // current bug's waiting bug and mark it as no collision
                } else if (bugList[key] == bug.waitingBug) {
                    if (dis >= 20) {
                        bug.waitingBug = null;
                        bug.collision = false;
                    }
                }
            }
        }
    }
}


/*
 *  Helper function to calculate the real coordinate of the center of
 *  the bug, since the original bug draws from antenna
 */
function calRealXY(bug) {
    x = (bug.x + 15) / 2;
    y = (bug.y + 35) / 2;

    return {x: x, y: y};
}


/*
 *  Draws the actural bug on canvas using the coordinates x and y
 * (based on the lecture code)
 */
function makeBug(x, y, type, alpha) {
    var color = type;
    context.globalAlpha = alpha;

    // Whiskers, legs and arms
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + 5, y + 15);
    context.lineTo(x + 10, y);

    context.moveTo(x + 5, y + 20);
    context.lineTo(x + 4, y + 22);
    context.lineTo(x + 6, y + 22);
    context.lineTo(x + 5, y + 20);

    // Triangles on the tips
    context.moveTo(x, y);
    context.lineTo(x, y + 3);
    context.lineTo(x + 1.73, y + 2.4);
    context.lineTo(x, y);

    context.moveTo(x + 10, y);
    context.lineTo(x + 8.27, y + 2.4);
    context.lineTo(x + 10, y + 3);
    context.lineTo(x + 10, y);

    context.moveTo(x, y + 20);
    context.lineTo(x, y + 22);
    context.lineTo(x + 1.6, y + 21.25);
    context.lineTo(x, y + 22);

    context.moveTo(x + 10, y + 20);
    context.lineTo(x + 8.4, y + 21.25);
    context.lineTo(x + 10, y + 22);
    context.lineTo(x + 10, y + 20);

    context.moveTo(x, y + 34);
    context.lineTo(x, y + 32.25);
    context.lineTo(x + 1.6, y + 32);
    context.lineTo(x, y + 34);

    // hand
    context.moveTo(x-4, y + 25);
    context.lineTo(x-4, y + 23.25);
    context.lineTo(x -2.4, y + 23);
    context.lineTo(x-4, y + 25);

    context.moveTo(x + 10, y + 34);
    context.lineTo(x + 8.4, y + 32.25);
    context.lineTo(x + 10, y + 32);
    context.lineTo(x + 10, y + 34);

    context.moveTo(x + 14, y + 25);
    context.lineTo(x + 12.4, y + 23.25);
    context.lineTo(x + 14, y + 23);
    context.lineTo(x + 14, y + 25);

    context.stroke();

    // Body parts
    context.beginPath();
    context.arc(x + 5, y + 15, 7, 0, 5 * Math.PI);

    context.moveTo(x + 5, y + 20);
    context.bezierCurveTo(x, y + 20, x, y + 25, x + 5, y + 33.75);

    context.moveTo(x + 5, y + 20);
    context.bezierCurveTo(x + 10, y + 20, x + 10, y + 25, x + 5, y +33.75);

    context.lineWidth = 1;
    context.fillStyle = color;
    context.strokeStyle = BLACK

    context.stroke();
    context.fill();

    // Eyes and Mouth
    context.beginPath();
    context.arc(x + 2.3, y + 13.2, 1.75, 0, 3 * Math.PI);
    context.arc(x + 7.75, y + 13.2, 1.75, 0, 3 * Math.PI);
    context.fillStyle = WHITE;
    context.fill();

    context.beginPath();
    context.arc(x + 2.3, y + 13.2, 0.95, 0, 3 * Math.PI);
    context.arc(x + 7.75, y + 13.2, 0.95, 0, 3 * Math.PI);
    context.fillStyle = BLACK;
    context.fill();

    context.beginPath();
    context.arc(x + 5, y + 16.5, 2.5, 0, Math.PI, false);

    context.stroke();
}


/*
 *  The constructor of the food object
 */
function foodConstructor(x, y) {
    // coordinates
    this.x = x;
    this.y = y;

    // Is eaten or not
    this.status = true;
}

/*
 *  Calculates the nearest food to bug
 */
function calculateGoal(bug) {
    var dis = 10000;

    // timeFuncs through all foods and calculates the distance
    for (var key in foodList) {

        // If the food is not eaten
        if (foodList[key].status == true) {
            var temp = Math.sqrt((foodList[key].x - bug.x) *
                        (foodList[key].x - bug.x) +
                        (foodList[key].y - bug.y) *
                        (foodList[key].y - bug.y));

            // Updates the attributes of bug if found nearer food
            if (temp < dis) {
                dis = temp;
                bug.goal = key;
                bug.direction_y = (bug.speed / 30) * (foodList[key].y -
                                    bug.y) / dis;
                bug.direction_x = (bug.speed / 30) * (foodList[key].x -
                                    bug.x) / dis;

                // If the distance is less than 10, then the food is eaten
                if (temp < 10)
                    foodList[key].status = false;
            }
        }
    }
}


/*
 *  Creates food objects and adds them to foodList
 */
function foodCreate() {
    var x, y;

    for (var i = 0; i < foodNum; i++) {

        x = getRandomInt(40, 360);
        y = getRandomInt(190, 600);

        // If the food collapses with other foods, change a coordinate
        while (isFoodCollapse(x, y)) {
            x = getRandomInt(40, 360);
            y = getRandomInt(190, 660);
        }

        foodList.push(new foodConstructor(x, y));
    }

    // Draws the food
    drawFoods();
}


/*
 *  Helper function to determine if two foods collapsed
 */
function isFoodCollapse(x, y) {

    if (foodList.length != 0) {
        for (var key in foodList) {
            var dist = Math.sqrt((foodList[key].x - x) *
                        (foodList[key].x - x) +
                        (foodList[key].y - y) *
                        (foodList[key].y - y));
            if (dist <= 50) {
                return true;
            }
        }
    }
    return false;
}


/*
 *  Draws the food if it is not eaten
 */
function drawFoods() {
    for (var key in foodList) {
        if (foodList[key].status == true)
            drawFood(foodList[key]);
    }
}


/*
 *  Draws the food on canvas using the food picture
 */
function drawFood(food) {

    context.globalAlpha = 1.0;
    context.drawImage(img, food.x, food.y);
}


/*
 *  Checks if user's mouse click kills any bug
 */
function getPosition(event) {

    // Get the coordinates of user click
    var x = event.offsetX;
    var y = event.offsetY;

    for (var key in bugList) {
        var dis = Math.sqrt((bugList[key].x - x) *
                    (bugList[key].x - x) +
                    (bugList[key].y - y) *
                    (bugList[key].y - y));

        // If distance is less than 30, bug is killed, updates
        // score accordingly
        if (bugList[key].status && dis < 30) {
            bugList[key].status = false;
            if (bugList[key].type === BLACK)
                score += 5;
            else if (bugList[key].type === RED)
                score += 3;
            else if (bugList[key].type === ORANGE)
                score += 1;
        }
    }
}


/*
 *  Checks if the game is over
 */
function checkGameOver() {
    // Flag indicates if all foods are eaten
    var isAllEaten = true;

    for (var food in foodList) {
        if (foodList[food].status) {
            isAllEaten = false;
            break;
        }
    }

    // If all foods are eaten then game over
    if (isAllEaten) {

        // Pause the game
        pause();

        // Write new high score to local storage
        updateHighScore();

        // Update HTML, show end page
        title.innerHTML = TEXT_GAME_OVER;
        mainGame.style.display = TEXT_NONE;
        endPage.style.display = TEXT_BLOCK;
        body.style.background = BACKGROUND_START;
        yourScore.innerHTML = TEXT_YOUR_SCORE + score;

    // If level 1 cleared, go to next level automatically
    } else if (level == 1 && time == 0) {
        isNewLevel = true;
        updateHighScore();
        restartGame(2);

    // If level 2 cleared, game complete
    } else if (level == 2 && time == 0) {
        pause();
        isNewLevel = false;
        updateHighScore();
        title.innerHTML = TEXT_MISSION_COMPLETE;
        mainGame.style.display = TEXT_NONE;
        endPage.style.display = TEXT_BLOCK;
        body.style.background = BACKGROUND_START;
        yourScore.innerHTML = TEXT_YOUR_SCORE + score;
    }
}


/*
 *  Exits current game and go back to start page.
 *  Called when the "OK" button is clicked
 */
function exitGame() {
    isSecondTime = true;
    startPage.style.display = TEXT_BLOCK;
    endPage.style.display = TEXT_NONE;
    restoreScore();
}


/*
 *  Updates high score for both levels to local storage
 */
function updateHighScore() {
    if (level == 1) {
        if (localStorage.getItem("highscoreOne") !== null) {
            if (localStorage.getItem("highscoreOne") < score)
                localStorage.setItem("highscoreOne", score);
        } else {
            localStorage.setItem("highscoreOne", score);
        }
    } else if (level == 2) {
        if (localStorage.getItem("highscoreTwo") !== null) {
            if (localStorage.getItem("highscoreTwo") < score)
                localStorage.setItem("highscoreTwo", score);
        } else {
            localStorage.setItem("highscoreTwo", score);
        }
    }
}


/*
 *  Pauses or resumes the game. Called when the pause/resume
 *  button is clicked
 */
function checkIsPause(event) {

    var x = getMousePos(canvas, event).x;
    var y = getMousePos(canvas, event).y;

    // If mouse in pause/resume button region, pauses/resumes the game
    if (x >= 170 && x <= 230 && y >= 0 && y <= 50) {
        pause_resume();
    }
}


/*
 *  Get the relative mouse position regarding to canvas
 */
function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}


/*
 *  Pauses the game if the game is running, Resumes the game if the game
 *  is pausing
 */
function pause_resume() {
    if (isPause) {
        drawPause();
        resume();
    } else {
        drawResume();
        pause();
    }
}


/*
 *  Recursively calls it self every one to three seconds to
 *  continuely create bugs
 */
function timeFunc() {
    setTimeout(function() {
        if (!isPause) {
            bugCreate();
        }
        timeFunc();
    }, getRandomInt(1000, 3000));
}


/*
 *  Pauses the game
 */
function pause() {
    isPause = true;
    clearInterval(reloadInterval);
    canvas.removeEventListener("mousedown", getPosition, false);
}


/*
 *  Resumes the game
 */
function resume() {
    isPause = false;
    reloadInterval = setInterval(reload, frameInterval);
    canvas.addEventListener("mousedown", getPosition, false);
}


/*
 *  Helper function to randomly generate integer between min and max
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
