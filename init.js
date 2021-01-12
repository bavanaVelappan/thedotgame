'use strict';

var counterTotalValidMoves = 0;
const node = document.getElementById('app');
var currentSelection = new Object();
var existingPoints = [];
var moveSuccessfullyCompleted = null;
var nodeFirstMove = new Object();
var nodeLastMove = new Object();
var nodeOrigination = "";
var proposedIntermediatePoints = [];
var turn = 1;
var endNodeError = null;


// Update the second argument to `Elm.Main.embed` with your selected API. See
// the Intro section of the technical assessment documentation for more
// information:
// https://technical-assessment.konicaminoltamarketplace.com
const app = Elm.Main.embed(node, {
    api: 'Client',
    hostname: '',
});

window.onload = function () {
    var moveTimeLimit = 60 * 1,
        display = document.querySelector('#time');
    return startTimer(moveTimeLimit, display);
};


app.ports.startTimer.subscribe((int) => {
    setTimeout(() => {
        app.ports.timeout.send(int);
    }, 10000);
});

app.ports.request.subscribe((message) => {

    //Take the message and turn the string into JSON
    message = JSON.parse(message);

    //Get the JSON response from the function based on the incoming json object
    var responseObj = processIncomingMessage(message);

    // Parse the message to determine a response, then respond:
    app.ports.response.send(responseObj);
});


function processIncomingMessage(message) {

    var incomingMessage = message.msg;
    var incomingBody = message.body;

    if (incomingMessage == "INITIALIZE") {

        return processInitialize();
        
    }

    else if (incomingMessage == "NODE_CLICKED") {
        
        return processNodeClicked(incomingBody);
    }
    else {

        throw new Exception("Unknown message: " + incomingMessage);

    }

}

function processInitialize() {

    var outgoing = new Object();

    outgoing.msg = "INITIALIZE";
    outgoing.body = new Object();
    
    outgoing.body.newLine = null;
    outgoing.body.heading = "Player 1";
    outgoing.body.message = null;

    currentSelection = null;
    turn = 1;
    console.log(outgoing.msg, outgoing);

    return outgoing;

};

function processNodeClicked(incomingBody) {
    //Create an object to use as outgoing
    var outgoing = new Object();

    outgoing.body = new Object();


    //If there is no node selected, it means the human wants it as their start node
    if (currentSelection == null) {
        if (counterTotalValidMoves < 1) {
            
            //Valid Move
            outgoing.msg = "VALID_START_NODE";

            outgoing.body.newLine = null;
            outgoing.body.heading = "Player " + turn;
            outgoing.body.message = "Select a second node to complete the line.";
           // endNodeError = "No";
            //Now we set the current selection to the incoming value
            currentSelection = incomingBody;
        } else if ((incomingBody.x == nodeFirstMove.x) && (incomingBody.y == nodeFirstMove.y) || (incomingBody.x == nodeLastMove.x) && (incomingBody.y == nodeLastMove.y)) {

            nodeOrigination = (incomingBody.x == nodeFirstMove.x) && (incomingBody.y == nodeFirstMove.y) ? "nodeEndpointA" : "nodeEndpointB";
            //Valid Move
            outgoing.msg = "VALID_START_NODE";

            outgoing.body.newLine = null;
            outgoing.body.heading = "Player " + turn;
            outgoing.body.message = "Select a second node to complete the line.";
           // endNodeError = "No";
            //Now we set the current selection to the incoming value
            currentSelection = incomingBody;
        } 
        else {

            //DO nothing. This is just a deselection
            outgoing.msg = "INVALID_START_NODE";

            outgoing.body.newLine = null;
            outgoing.body.heading = "Player " + turn;
            outgoing.body.message = "Invalid Start Node!";

            currentSelection = null;

        }

    }

    //If the chosen end node is the beginning node, we just want to deselect
    else if (incomingBody.x == currentSelection.x && incomingBody.y == currentSelection.y) {
       
        //DO nothing. This is just a deselection
        outgoing.msg = "INVALID_START_NODE";

        outgoing.body.newLine = null;
        outgoing.body.heading = "Player " + turn;
        outgoing.body.message = "Select a node to start.";

        currentSelection = null;
        //console.log(outgoing);
    }

    //Check and make sure the movement human wants is valid
    else if (isValidMovementChecksInitial(currentSelection, incomingBody)) {
        var xValues = [];
        var yValues = [];
        var xLow;
        var xHigh;
        var yLow;
        var yHigh;
        var differenceX;
        var differenceY;
        var differenceValues = [];
        var differenceHighest;
        var numberOfIntermediatePoints;

        //If the exisiting points list is empty, that means we need to add the beginning and end points to the existing points list. If it is not empty, we just need to add the new endpoint       
        if (existingPoints.length == 0) {
            existingPoints.push(currentSelection);
        }

        //This will identify lowest variable value, highest variable value, and the absolute difference between current and incoming x's and y's
        xValues.push(currentSelection.x, incomingBody.x)
        yValues.push(currentSelection.y, incomingBody.y)
        xValues.sort(function (a, b) { return a - b });
        yValues.sort(function (a, b) { return a - b });
        xLow = xValues[0];
        xHigh = xValues[1];
        yLow = yValues[0];
        yHigh = yValues[1];
        differenceX = xHigh - xLow;
        differenceY = yHigh - yLow;
        //This uses the greatest difference to calculate number of intermediary point using *2 -1 forumla.
        differenceValues.push(differenceX, differenceY)
        differenceValues.sort(function (a, b) { return a - b });
        differenceHighest = differenceValues[1];
        numberOfIntermediatePoints = differenceHighest * 2 - 1;
            // console.log(numberOfIntermediatePoints);

        //This calculates intermediate point coordinates then pushes to existingPoints array.
        for (var z = .5; z <= numberOfIntermediatePoints / 2; z += .5) {
            var intermediatePointX;
            var intermediatePointY;

            //This calculates lines heading 90 and 270 degrees 
            if (xLow == xHigh) {
                intermediatePointX = xLow;
                intermediatePointY = yLow + z
            } else {
                intermediatePointX = xLow + z
            }

            //This calculates lines heading 0 and 180 degrees 
            if (yLow == yHigh) {
                intermediatePointY = yLow;
            }

            //This calculates lines heading 315 degrees 
            if (yLow !== yHigh && currentSelection.y > incomingBody.y && currentSelection.x < incomingBody.x) {
                intermediatePointY = yHigh - z
            }

            //This calculates lines heading 45 degrees 
            if (yLow !== yHigh && currentSelection.y < incomingBody.y && currentSelection.x < incomingBody.x) {
                intermediatePointY = yLow + z
            }

            //This calculates lines heading 135 degrees 
            if (yLow !== yHigh && currentSelection.y < incomingBody.y && currentSelection.x > incomingBody.x) {
                intermediatePointY = yHigh - z
            }

            //This calculates lines heading 225 degrees 
            if (yLow !== yHigh && currentSelection.y > incomingBody.y && currentSelection.x > incomingBody.x) {
                intermediatePointY = yLow + z
            }


            // console.log(intermediatePointX + " " + intermediatePointY)

            proposedIntermediatePoints.push(
                {
                    x: intermediatePointX,
                    y: intermediatePointY
                }
            );
        }
        
        if (isValidMovementChecksFinal()) {
            counterTotalValidMoves++;
            //This checks if currentSelection node is also first valid game move, allowing for correct start node selection validation
            if (counterTotalValidMoves == 1) {

                nodeFirstMove = currentSelection;
            }

            if (nodeOrigination === "nodeEndpointA") {
                nodeFirstMove = incomingBody;
            } else if (nodeOrigination === "nodeEndpointA") {
                //This records new endpoint as the last move, allowing for correct start node selection validation
                nodeLastMove = incomingBody;
            } else {
                //This records new endpoint as the last move, allowing for correct start node selection validation
                nodeLastMove = incomingBody;
            }

            for (var z = 0; z < proposedIntermediatePoints.length; z++) {
                existingPoints.push(
                    {
                        x: proposedIntermediatePoints[z].x,
                        y: proposedIntermediatePoints[z].y
                    }
                );
            }
            //This empties holding array
            proposedIntermediatePoints.length = 0;

            //This adds new endpoint to existingPoints array
            existingPoints.push(incomingBody);

            //Line is deemed valid, so we create a line
            outgoing.msg = "VALID_END_NODE";

            //This will shift back and forth between 1 and 2            
            turn = (turn % 2) + 1;

            outgoing.body.newLine = getLine(currentSelection, incomingBody);
            outgoing.body.heading = "Player " + turn;
            outgoing.body.message = null;
            currentSelection = null;

            moveSuccessfullyCompleted = true;
        } else {
            outgoing.msg = "INVALID_END_NODE";
            outgoing.body.newLine = null;
            outgoing.body.heading = "Player " + turn;
            outgoing.body.message = "Invalid move!";
            currentSelection = null;
            //This empties holding array
            proposedIntermediatePoints.length = 0;
        }

    }
        
    else {

        outgoing.msg = "INVALID_END_NODE";

        outgoing.body.newLine = null;
        outgoing.body.heading = "Player " + turn;
        outgoing.body.message = "Invalid move!";
        currentSelection = null;

    }
    console.log("RESPONSE",outgoing);
    return outgoing;

}


function isValidMovementChecksInitial(startPoint, endPoint) {
    var diffX = Math.abs(startPoint.x - endPoint.x);
    var diffY = Math.abs(startPoint.y - endPoint.y);

    //If the proposed end point is already in the line, that is invalid
    if (containsPoint(endPoint)) {

        return false;
    }

    //If the proposed line is not at at a 0, 45, or 90 degree angle, it is invalid
    if (diffX / diffY !== 0 && diffX / diffY !== 1 && diffX / diffY !== Infinity) {

        return false;
    }

    //If the proposed line pass both these tests, it can proceed to next round of testing
    return true;

}

function containsPoint(toCheck) {

    // console.log(JSON.parse(JSON.stringify(existingPoints)))
    // console.log(JSON.parse(JSON.stringify(proposedIntermediatePoints)))
   // console.log(existingPoints);
    for (var x = 0; x < existingPoints.length; x++) {
        
        var p = existingPoints[x];
        var checkThisPoint = "Checking " + p.x + "," + p.y;
        checkThisPoint += " -> " + toCheck.x + "," + toCheck.y;

         //console.log(checkThisPoint);

        if (p.x == toCheck.x && p.y == toCheck.y) {
            return true;
        }

    }
    return false;

}

function getLine(start, end) {

    var newLine = new Object();
    newLine.start = start;
    newLine.end = end;

    console.log(newLine);
    return newLine;
};

function isValidMovementChecksFinal() {
   // console.log(existingPoints);
    for (var z = 0; z < proposedIntermediatePoints.length; z++) {
        // console.log(proposedIntermediatePoints.length);
        if (containsPoint(proposedIntermediatePoints[z])) {
            //console.log(proposedIntermediatePoints[z].x + " " + proposedIntermediatePoints[z].y)

            return false;
        } else {
            
            // console.log( proposedIntermediatePoints[z].x + " " + proposedIntermediatePoints[z].y)
            
        }
    }
    return true;
}

function startTimer(duration, display) {

    var timer = duration, minutes, seconds;
    var myTimer = setInterval(function () {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            var winner;
            winner = turn == 1 ? "Player 2 wins!" : "Player 1 Wins!";
            var outgoing = new Object();
            outgoing.body = new Object();
            outgoing.msg = "GAME_OVER";
            outgoing.body.newLine = null;
            outgoing.body.heading = "GAME OVER";
            outgoing.body.message = winner;
            console.log("RESPONSE", outgoing);
            
            clearInterval(myTimer);
            alert(winner)
            return outgoing;
        }
        if (moveSuccessfullyCompleted == true) {
            moveSuccessfullyCompleted = false;
            timer = duration;
        }

    }, 1000);

};

