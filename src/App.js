import './App.css';
import { Howl } from 'howler';
import soundURL from './assert/sound.m4a';
import { useEffect, useRef, useState } from 'react';
import '@tensorflow/tfjs-backend-cpu';
import * as tf from '@tensorflow/tfjs';

const sound = new Howl({
  src: [soundURL]
});


const mobilenetModule = require('@tensorflow-models/mobilenet');
const knnClassifier = require('@tensorflow-models/knn-classifier');

function App() {
  const NOT_TOUCH_LABEL = 'Not Touch';
  const TOUCHED_LABEL = 'Touched';
  const TOUCH_CONFIDENCE = 0.7;
  const TrainingTime = 50;
  const video = useRef();
  const canPlaySound = useRef(true);
  const classifier = useRef();
  const mobilenet = useRef();
  const [touched, setTouched] = useState(false);

  const init = async () => {
    console.log('intit...');
    await setupCamera()
    console.log('setup camera success! Waiting...');

    classifier.current = knnClassifier.create();
    mobilenet.current = await mobilenetModule.load();

    console.log('Process Done!');
    console.log('Dont push your hands on your face and click Train Not Touch button');
  }

  const setupCamera = () => {
    return new Promise((resolve, reject) => {
      navigator.getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia || 
        navigator.msGetUserMedia;

      if(navigator.getUserMedia){
        navigator.getUserMedia(
          {video: true},
          stream => {
            video.current.srcObject = stream;
            video.current.addEventListener('loadeddata', resolve);
          },
          error => reject('Access Your Camera And Reload Website')
        )
      }
    })
  }

  useEffect(() => {
    init();

    sound.on('end', function(){
      canPlaySound.current = true;
    });

    return () => {

    }
  },[])

  const train = async label => {
    console.log(`[${label}] is being Trained...`);
    for(let i=0; i<TrainingTime; i++){
      console.log(`Progress ${parseInt((i+1) / TrainingTime * 100)}%`);
      await training(label)
    }
    console.log('Training Successfully!');
    if(label !== TOUCHED_LABEL)console.log('Slowly bring your hands to your face and click Train Touched button');
    else console.log('click Run button and Relax =)))))))');
  }

  const training = label => {
    return new Promise(async resolve => {
      const embedding = mobilenet.current.infer(
        video.current,
        true
      );
      classifier.current.addExample(embedding, label);
      await sleep(100);
      resolve();
    })
  }

  const run = async () => {
    const embedding = mobilenet.current.infer(
      video.current,
      true
    );
    const result = await classifier.current.predictClass(embedding);
    if(result.label === TOUCHED_LABEL &&
        result.confidences[result.label] > TOUCH_CONFIDENCE){
          console.log(TOUCHED_LABEL);
          if(canPlaySound.current){
            canPlaySound.current = false;
            sound.play();
          }
          setTouched(true);
    }else{
      console.log(NOT_TOUCH_LABEL);
      setTouched(false);
    }
    run()
  }

  const sleep = (ms = 0) => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  return (
    <div className={`App ${touched && 'touched'}`}>
      <h1>ACCESS YOUR CAMERA</h1>
      <video 
        ref={video}
        className='video'
        autoPlay
      />
      <h1>Open Your Console To Get Tutorial</h1>
      <h2>(Ctrl + Shift + I -> tab Console)</h2>
      <div className='control'>
        <button className='btn' onClick={() => train(NOT_TOUCH_LABEL)}>Train {NOT_TOUCH_LABEL}</button>
        <button className='btn' onClick={() => train(TOUCHED_LABEL)}>Train {TOUCHED_LABEL}</button>
        <button className='btn' onClick={() => run()}>Run</button>
      </div>
    </div>
  );
}

export default App;
