//Copyright - Greg Krause, Matt McQuinn 10/2/2014
//

/************************************************

Hardware Note:
	This software is meant to be run with a 
	tessel, accelerometer, ambient sound 
	detector, a piezo speaker, as well as an LED.

~~~~~~~ The SDA (Safe Driver Assistant) ~~~~~~~~

	Meet the safe driver assistant! This build is
designed to help both new and veteran drivers 
realize when they are driving in a potentially 
unsafe manner. 

	The SDA relies on our threshold system. All
input from the tessel is compared to threshold 
limits set by _thresh variables. Any values 
that surpass said thresholds trigger notifications.

	Any of the following events will set off 
a combination of beeps and LED blinks: Taking
a sharp turn, accelerating or braking too quickly,
andextremely loud noise/music.
 
************************************************/

//Requirements
var tessel = require('tessel');
var ambientlib = require('ambient-attx4');


// setup ports
var accel = require('accel-mma84').use(tessel.port['A']);
var ambient = ambientlib.use(tessel.port['B']);
var port = tessel.port['GPIO'];
var pin = port.pwm[0]; // G4
var ledpin1 = port.analog[0]; // A1

//Forward Declaration
var last_movement;

//Used to test if a call to accelRate has already been made
var initialized =false;

// Thresholds
var x_thresh = 0.26;//should be 13
var y_thresh = 0.26;//should be 13
var z_thresh = 0.9;
// var crash_thresh=1.8;
var sound_thresh = 0.24;

//Notes for speaker
var notes = 
{
	'C'		:	523.25,
	'C#'	:	554.37,
	'D'		:	587.33,
	'D#'	:	622.25,
	'E'		:	659.25,
	'F'		:	698.46,
	'F#'	:	739.99,
	'G'		:	783.99,
	'G#'	:	830.61,
	'A'		:	880.00,
	'A#'	:	932.33,
	'B'		:	987.77,
	'c'		:	1046.50,
	'c#'	:	1108.73,
	'd'		:	1174.66,
	'd#'	:	1244.51,
	'e'		:	1318.51,
	'f'		:	1396.91,
	'f#'	:	1479.98,
	'g'		:	1567.98,
	'g#'	:	1661.22,
	'a'		:	1760.00,
	'a#'	:	1864.66,
	'b'		:	1975.53
};

//This function plays a note from notes[s] and turns on ledpin1
//for one second
function notify(note)
{
	port.pwmFrequency(note);// The default frequency
	pin.pwmDutyCycle(0.99);
	ledpin1.write(1);
	setTimeout(function() {
		 pin.pwmDutyCycle(0);
		 ledpin1.write(0);
	},1000);
}

//Beeps and led lights for around 3 seconds if crash_thresh is exceeded
// function crashAlert()
// {
// 	var z = 0;
// 	console.log('A crash has occured.');
// 	while(z<275){
// 		pin.pwmDutyCycle(0.8);
// 	    port.pwmFrequency(notes['E']);
// 		z++;
// 		console.log(x);
// 	}
// }

//Causes just an led notification to go off (no sound) to indicate 
//volume inside the card is potentially dangerous
function soundSensorNotification()
{
	ledpin1.write(1);
	setTimeout(function() {
		 ledpin1.write(0);
	},1000);
}

//Checks for reckless acceleration rates, and makes notification calls
//accordingly. Requires last xyz and current xyz coordinates to run
function accelRate(last, current)
{
	if(initialized){

		var x_delt = Math.abs(last[0] - current[0]);
		var y_delt = Math.abs(last[1] - current[1]);
		var z_delt = Math.abs(last[2] - current[2]);

		if(x_delt > x_thresh)
		{
			console.log("X changed from: ", last[0], " to ", current[0]);
			console.log("X delt: ", x_delt);
			notify(notes['C']);
		}
		// console.log('test');
		if(y_delt > y_thresh)
		{
			console.log("Y changed from: ", last[1], " to ", current[1]);
			console.log("Y delt: ", y_delt);
			notify(notes['C']);
		}
		// if(x_delt > crash_thresh || y_delt > crash_thresh || z_delt > crash_thresh)
		// {
		// 	console.log(x_delt, y_delt, z_delt);
		// 	crashAlert();
		// }
	}

	initialized = true;

}

accel.on('ready', function () {
  accel.setOutputRate(6.25, function rateSet() {
    accel.setScaleRange( 8, function scaleSet() {
      accel.on('data', function (xyz) {
        accelRate(last_movement, xyz);
        last_movement = xyz;
      });
    });
  });
});

// Initialize ambient sound trigger
ambient.on('ready', function () 
{
     ambient.setSoundTrigger(sound_thresh);
});

//Calls soundSendorNotification to activate sound sensor notification (LED) 
ambient.on('sound-trigger', function(data) 
{
    soundSensorNotification();
});