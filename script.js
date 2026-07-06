const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NOTE_ES = { C:"Do", "C#":"Do sostenido", Db:"Re bemol", D:"Re", "D#":"Re sostenido", Eb:"Mi bemol", E:"Mi", F:"Fa", "F#":"Fa sostenido", Gb:"Sol bemol", G:"Sol", "G#":"Sol sostenido", Ab:"La bemol", A:"La", "A#":"La sostenido", Bb:"Si bemol", B:"Si" };
const FLATS = { Db:"C#", Eb:"D#", Gb:"F#", Ab:"G#", Bb:"A#" };
const STEPS = [0, 2, 4, 5, 7, 9, 11];
const FUNCTIONS = ["reposo", "preparación", "reposo", "preparación", "tensión", "reposo", "tensión"];
const CHORD_TYPES = ["mayor", "menor", "menor", "mayor", "mayor", "menor", "disminuido"];

const KEYS = [
  { label:"Do mayor", root:"C", scale:["C","D","E","F","G","A","B"] },
  { label:"Sol mayor", root:"G", scale:["G","A","B","C","D","E","F#"] },
  { label:"Re mayor", root:"D", scale:["D","E","F#","G","A","B","C#"] },
  { label:"La mayor", root:"A", scale:["A","B","C#","D","E","F#","G#"] },
  { label:"Fa mayor", root:"F", scale:["F","G","A","Bb","C","D","E"] },
  { label:"Si bemol mayor", root:"Bb", scale:["Bb","C","D","Eb","F","G","A"] }
];
const ROUTES = [
  { id:"home", label:"Reposo, preparación, tensión y regreso", degrees:[1,4,5,1], note:"Escucha cómo el recorrido sale del reposo, crea tensión y vuelve a sentirse estable." },
  { id:"open", label:"Reposo, tensión, reposo suave y preparación", degrees:[1,5,6,4], note:"Observa que el final queda abierto: la preparación invita a continuar." },
  { id:"circle", label:"Reposo, reposo suave, preparación y tensión", degrees:[1,6,4,5], note:"El recorrido comienza estable y termina con una tensión que pide volver al inicio." },
  { id:"arrival", label:"Preparación, tensión, llegada y reposo suave", degrees:[2,5,1,6], note:"Aquí la llegada al tercer acorde se percibe con mucha claridad." }
];

const $ = selector => document.querySelector(selector);
const keySelect = $("#keySelect");
const progressionSelect = $("#progressionSelect");
const voiceTable = $("#voiceTable");
const linkAnalysis = $("#linkAnalysis");
const progressionTitle = $("#progressionTitle");
const teacherNote = $("#teacherNote");
let currentVoicings = [];
let audioContext;
let currentExercise = null;
let correctAnswers = 0;
let attempts = 0;

const normalize = note => FLATS[note] || note;
const indexOf = note => NOTES.indexOf(normalize(note));
const transpose = (root, amount) => NOTES[(indexOf(root) + amount + 120) % 12];
const spanish = note => NOTE_ES[note] || NOTE_ES[normalize(note)] || note;
const scaleFor = root => KEYS.find(key => key.root === root)?.scale || STEPS.map(step => transpose(root, step));

function chordFor(scale, degree) {
  const i = degree - 1;
  return {
    functionName: FUNCTIONS[i],
    name: `${spanish(scale[i])} ${CHORD_TYPES[i]}`,
    notes: [scale[i], scale[(i + 2) % 7], scale[(i + 4) % 7]]
  };
}

function nearest(pitchClass, target) {
  let best = pitchClass + 60;
  for (let octave = 3; octave <= 6; octave += 1) {
    const candidate = pitchClass + octave * 12;
    if (Math.abs(candidate - target) < Math.abs(best - target)) best = candidate;
  }
  return best;
}

function firstVoicing(chord) {
  const tones = chord.notes.map(indexOf);
  return [nearest(tones[0], 48), nearest(tones[1], 60), nearest(tones[2], 67)];
}

function nextVoicing(chord, previous) {
  const pitches = chord.notes.map(indexOf);
  const permutations = [
    [0,1,2], [0,2,1], [1,0,2],
    [1,2,0], [2,0,1], [2,1,0]
  ];

  let bestVoicing = null;
  let bestDistance = Infinity;

  permutations.forEach(order => {
    const candidate = order
      .map((pitchIndex, voiceIndex) => nearest(pitches[pitchIndex], previous[voiceIndex]))
      .sort((a,b) => a-b);
    const usesThreeNotes = new Set(candidate.map(midi => ((midi % 12) + 12) % 12)).size === 3;
    if (!usesThreeNotes) return;

    const distance = candidate.reduce((total, midi, voiceIndex) => {
      return total + Math.abs(midi - previous[voiceIndex]);
    }, 0);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestVoicing = candidate;
    }
  });

  return bestVoicing;
}

function buildVoicings(chords) {
  return chords.reduce((all, chord, i) => {
    all.push(i ? nextVoicing(chord, all[i-1]) : firstVoicing(chord));
    return all;
  }, []);
}

function midiName(midi) {
  return spanish(NOTES[((midi % 12) + 12) % 12]);
}

function movement(from, to) {
  const distance = to - from;
  if (!distance) return "permanece";
  const direction = distance > 0 ? "sube" : "baja";
  const size = Math.abs(distance);
  if (size === 1) return `${direction} medio tono`;
  if (size === 2) return `${direction} un tono`;
  return `${direction} ${size} semitonos`;
}

function render() {
  const key = KEYS.find(item => item.root === keySelect.value) || KEYS[0];
  const route = ROUTES.find(item => item.id === progressionSelect.value) || ROUTES[0];
  const chords = route.degrees.map(degree => chordFor(scaleFor(key.root), degree));
  currentVoicings = buildVoicings(chords);
  progressionTitle.textContent = `${key.label}: ${route.label}`;
  teacherNote.innerHTML = `<strong>Escucha con atención:</strong> ${route.note}`;

  voiceTable.innerHTML = `
    <caption>Notas escritas por voces</caption>
    <thead><tr><th>Voz</th>${chords.map((chord, i) => `<th>Paso ${i+1}<small>${chord.functionName}</small></th>`).join("")}</tr></thead>
    <tbody>
      ${[2,1,0].map((voice, row) => `<tr><th>${["Aguda","Media","Grave"][row]}</th>${currentVoicings.map(voicing => `<td>${midiName(voicing[voice])}</td>`).join("")}</tr>`).join("")}
      <tr class="all-notes"><th>Notas del acorde</th>${chords.map(chord => `<td>${chord.notes.map(spanish).join(" · ")}</td>`).join("")}</tr>
    </tbody>`;

  linkAnalysis.innerHTML = currentVoicings.slice(1).map((voicing, i) => `
    <article>
      <h3>Del paso ${i+1} al paso ${i+2}</h3>
      <ul>
        <li>Voz aguda: ${midiName(currentVoicings[i][2])} → ${midiName(voicing[2])}; ${movement(currentVoicings[i][2], voicing[2])}.</li>
        <li>Voz media: ${midiName(currentVoicings[i][1])} → ${midiName(voicing[1])}; ${movement(currentVoicings[i][1], voicing[1])}.</li>
        <li>Voz grave: ${midiName(currentVoicings[i][0])} → ${midiName(voicing[0])}; ${movement(currentVoicings[i][0], voicing[0])}.</li>
      </ul>
    </article>`).join("");
}

function playTone(midi, start) {
  const ctx = audioContext || (audioContext = new (window.AudioContext || window.webkitAudioContext)());
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(.05, start + .03);
  gain.gain.exponentialRampToValueAtTime(.0001, start + .7);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start); oscillator.stop(start + .75);
}

function playRoute() {
  const ctx = audioContext || (audioContext = new (window.AudioContext || window.webkitAudioContext)());
  currentVoicings.forEach((voicing, i) => voicing.forEach((midi, j) => playTone(midi, ctx.currentTime + .05 + i*.8 + j*.012)));
}

function populateExerciseNotes(key = KEYS[0]) {
  const noteOptions = ["F", "Bb"].includes(key.root)
    ? ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"]
    : NOTES;
  document.querySelectorAll(".exercise-note").forEach(select => {
    select.innerHTML = '<option value="">Elige una nota</option>';
    noteOptions.forEach(note => select.add(new Option(spanish(note), note)));
  });
}

function newExercise() {
  const key = KEYS[Math.floor(Math.random() * KEYS.length)];
  const route = ROUTES[Math.floor(Math.random() * ROUTES.length)];
  const step = 1 + Math.floor(Math.random() * (route.degrees.length - 1));
  const scale = scaleFor(key.root);
  const previousChord = chordFor(scale, route.degrees[step - 1]);
  const answerChord = chordFor(scale, route.degrees[step]);

  currentExercise = { key, route, step, answer: answerChord.notes.map(normalize) };
  populateExerciseNotes(key);
  $("#exerciseContext").textContent = `${key.label} · ${route.label}`;
  $("#exerciseQuestion").textContent = `Muévete de ${previousChord.name} a ${answerChord.name}`;
  $("#previousChordNotes").textContent = previousChord.notes.map(spanish).join(" · ");
  $("#exerciseFeedback").className = "exercise-feedback";
  $("#exerciseFeedback").textContent = "";
  document.querySelectorAll(".exercise-note").forEach(select => { select.value = ""; });
}

function checkExercise(event) {
  event.preventDefault();
  const selected = [...document.querySelectorAll(".exercise-note")].map(select => normalize(select.value));
  const feedback = $("#exerciseFeedback");

  if (selected.some(note => !note)) {
    feedback.className = "exercise-feedback incorrect";
    feedback.textContent = "Selecciona las tres notas antes de comprobar.";
    return;
  }

  attempts += 1;
  $("#attemptCount").textContent = attempts;

  if (new Set(selected).size !== 3) {
    feedback.className = "exercise-feedback incorrect";
    feedback.innerHTML = "<strong>Aún no.</strong> Has repetido una nota. Cada acorde de este ejercicio debe contener tres notas diferentes.";
    return;
  }

  const answer = [...currentExercise.answer].sort();
  const response = [...selected].sort();
  const isCorrect = answer.every((note, index) => note === response[index]);

  if (isCorrect) {
    correctAnswers += 1;
    $("#correctCount").textContent = correctAnswers;
    feedback.className = "exercise-feedback correct";
    feedback.innerHTML = `<strong>¡Correcto!</strong> El acorde contiene ${currentExercise.answer.map(spanish).join(", ")}. Puedes continuar con otro ejercicio.`;
  } else {
    const missing = currentExercise.answer.filter(note => !selected.includes(note)).map(spanish);
    const extra = selected.filter(note => !currentExercise.answer.includes(note)).map(spanish);
    feedback.className = "exercise-feedback incorrect";
    feedback.innerHTML = `<strong>Revisa la respuesta.</strong> ${missing.length ? `Falta ${missing.join(" y ")}.` : ""} ${extra.length ? `${extra.join(" y ")} no pertenece${extra.length > 1 ? "n" : ""} a este acorde.` : ""}`;
  }
}

function setup() {
  KEYS.forEach(item => keySelect.add(new Option(item.label, item.root)));
  ROUTES.forEach(item => progressionSelect.add(new Option(item.label, item.id)));
  keySelect.addEventListener("change", render);
  progressionSelect.addEventListener("change", render);
  $("#playProgression").addEventListener("click", playRoute);
  populateExerciseNotes();
  $("#exerciseForm").addEventListener("submit", checkExercise);
  $("#newExercise").addEventListener("click", newExercise);
  const toggle = $(".nav-toggle");
  const links = $(".nav-links");
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });
  document.querySelectorAll(".nav-links a").forEach(link => link.addEventListener("click", () => links.classList.remove("open")));
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); }
  }), { threshold:.1 });
  document.querySelectorAll(".reveal").forEach(element => observer.observe(element));
  render();
  newExercise();
}
setup();
