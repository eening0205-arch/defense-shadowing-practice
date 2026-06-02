(function () {
  const manifest = window.PRACTICE_MANIFEST;
  const segments = manifest && Array.isArray(manifest.segments) ? manifest.segments : [];
  const storageKey = "defense-shadowing-done-v1";
  const speedKey = "defense-shadowing-speed-v1";

  const state = {
    currentIndex: 0,
    filter: "all",
    done: new Set(JSON.parse(localStorage.getItem(storageKey) || "[]")),
    recordings: new Map(),
    mediaRecorder: null,
    recordingChunks: [],
    activeStream: null,
  };

  const els = {
    list: document.getElementById("segmentList"),
    player: document.getElementById("player"),
    playButton: document.getElementById("playButton"),
    prevButton: document.getElementById("prevButton"),
    nextButton: document.getElementById("nextButton"),
    russianText: document.getElementById("russianText"),
    chineseText: document.getElementById("chineseText"),
    segmentCounter: document.getElementById("segmentCounter"),
    progressText: document.getElementById("progressText"),
    progressBar: document.getElementById("progressBar"),
    speedSelect: document.getElementById("speedSelect"),
    loopToggle: document.getElementById("loopToggle"),
    autoNextToggle: document.getElementById("autoNextToggle"),
    doneButton: document.getElementById("doneButton"),
    recordButton: document.getElementById("recordButton"),
    playRecordingButton: document.getElementById("playRecordingButton"),
    recordingPlayer: document.getElementById("recordingPlayer"),
    downloadRecording: document.getElementById("downloadRecording"),
    recordStatus: document.getElementById("recordStatus"),
    recordLight: document.getElementById("recordLight"),
    filterButtons: Array.from(document.querySelectorAll("[data-filter]")),
  };

  function saveDone() {
    localStorage.setItem(storageKey, JSON.stringify(Array.from(state.done)));
  }

  function currentSegment() {
    return segments[state.currentIndex];
  }

  function renderList() {
    els.list.innerHTML = "";
    segments.forEach((segment, index) => {
      const item = document.createElement("li");
      item.className = "segment-item";
      item.dataset.id = segment.id;

      const button = document.createElement("button");
      button.type = "button";
      button.addEventListener("click", () => selectSegment(index));

      const no = document.createElement("span");
      no.className = "seg-no";
      no.textContent = segment.id;

      const title = document.createElement("span");
      title.className = "seg-title";
      title.textContent = segment.ru;

      const check = document.createElement("span");
      check.className = "seg-check";
      check.setAttribute("aria-hidden", "true");

      button.append(no, title, check);
      item.append(button);
      els.list.appendChild(item);
    });
    updateListState();
  }

  function updateListState() {
    Array.from(els.list.children).forEach((item, index) => {
      const segment = segments[index];
      const isDone = state.done.has(segment.id);
      item.classList.toggle("is-active", index === state.currentIndex);
      item.classList.toggle("is-done", isDone);
      item.classList.toggle(
        "is-hidden",
        (state.filter === "todo" && isDone) || (state.filter === "done" && !isDone)
      );
    });
  }

  function updateProgress() {
    const doneCount = state.done.size;
    const total = segments.length;
    const ratio = total ? (doneCount / total) * 100 : 0;
    els.progressText.textContent = `${doneCount} / ${total}`;
    els.progressBar.style.width = `${ratio}%`;
  }

  function updateRecordingControls() {
    const segment = currentSegment();
    const saved = segment ? state.recordings.get(segment.id) : null;
    if (saved) {
      els.recordingPlayer.src = saved.url;
      els.playRecordingButton.disabled = false;
      els.downloadRecording.classList.remove("is-disabled");
      els.downloadRecording.href = saved.url;
      els.downloadRecording.download = `recording-${segment.id}.webm`;
    } else {
      els.recordingPlayer.removeAttribute("src");
      els.playRecordingButton.disabled = true;
      els.downloadRecording.classList.add("is-disabled");
      els.downloadRecording.removeAttribute("href");
    }
  }

  function selectSegment(index) {
    if (!segments[index]) return;
    state.currentIndex = index;
    const segment = currentSegment();
    els.segmentCounter.textContent = segment.id;
    els.russianText.textContent = segment.ru;
    els.chineseText.textContent = segment.zh;
    els.player.src = segment.audio;
    els.player.loop = els.loopToggle.checked;
    els.player.playbackRate = Number(els.speedSelect.value);
    els.playButton.textContent = "播放";
    els.doneButton.textContent = state.done.has(segment.id) ? "取消已练" : "标记已练";
    updateRecordingControls();
    updateListState();
  }

  function selectRelative(offset) {
    const nextIndex = Math.max(0, Math.min(segments.length - 1, state.currentIndex + offset));
    selectSegment(nextIndex);
  }

  async function togglePlay() {
    if (!currentSegment()) return;
    if (els.player.paused) {
      await els.player.play();
    } else {
      els.player.pause();
    }
  }

  function setDone(segmentId, value) {
    if (value) {
      state.done.add(segmentId);
    } else {
      state.done.delete(segmentId);
    }
    saveDone();
    updateProgress();
    updateListState();
    els.doneButton.textContent = value ? "取消已练" : "标记已练";
  }

  async function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      els.recordStatus.textContent = "当前浏览器不支持录音";
      return;
    }

    state.activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.recordingChunks = [];
    state.mediaRecorder = new MediaRecorder(state.activeStream);
    state.mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) state.recordingChunks.push(event.data);
    });
    state.mediaRecorder.addEventListener("stop", finishRecording);
    state.mediaRecorder.start();
    els.recordStatus.textContent = "录音中";
    els.recordLight.classList.add("is-recording");
    els.recordButton.textContent = "停止录音";
  }

  function stopRecording() {
    if (state.mediaRecorder && state.mediaRecorder.state !== "inactive") {
      state.mediaRecorder.stop();
    }
  }

  function finishRecording() {
    if (state.activeStream) {
      state.activeStream.getTracks().forEach((track) => track.stop());
    }

    const segment = currentSegment();
    const oldRecording = segment ? state.recordings.get(segment.id) : null;
    if (oldRecording) URL.revokeObjectURL(oldRecording.url);

    const blob = new Blob(state.recordingChunks, { type: "audio/webm" });
    const url = URL.createObjectURL(blob);
    if (segment) state.recordings.set(segment.id, { blob, url });

    state.mediaRecorder = null;
    state.activeStream = null;
    state.recordingChunks = [];
    els.recordStatus.textContent = "录音已保存";
    els.recordLight.classList.remove("is-recording");
    els.recordButton.textContent = "开始录音";
    updateRecordingControls();
  }

  function bindEvents() {
    els.playButton.addEventListener("click", togglePlay);
    els.prevButton.addEventListener("click", () => selectRelative(-1));
    els.nextButton.addEventListener("click", () => selectRelative(1));
    els.player.addEventListener("play", () => {
      els.playButton.textContent = "暂停";
    });
    els.player.addEventListener("pause", () => {
      els.playButton.textContent = "播放";
    });
    els.player.addEventListener("ended", () => {
      const segment = currentSegment();
      if (segment) setDone(segment.id, true);
      if (els.autoNextToggle.checked && !els.loopToggle.checked) {
        const canMove = state.currentIndex < segments.length - 1;
        if (canMove) {
          selectRelative(1);
          els.player.play();
        }
      }
    });

    els.speedSelect.addEventListener("change", () => {
      els.player.playbackRate = Number(els.speedSelect.value);
      localStorage.setItem(speedKey, els.speedSelect.value);
    });
    els.loopToggle.addEventListener("change", () => {
      els.player.loop = els.loopToggle.checked;
      if (els.loopToggle.checked) els.autoNextToggle.checked = false;
    });
    els.autoNextToggle.addEventListener("change", () => {
      if (els.autoNextToggle.checked) els.loopToggle.checked = false;
      els.player.loop = els.loopToggle.checked;
    });
    els.doneButton.addEventListener("click", () => {
      const segment = currentSegment();
      if (segment) setDone(segment.id, !state.done.has(segment.id));
    });
    els.filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        state.filter = button.dataset.filter;
        els.filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
        updateListState();
      });
    });
    els.recordButton.addEventListener("click", async () => {
      try {
        if (state.mediaRecorder) {
          stopRecording();
        } else {
          await startRecording();
        }
      } catch (error) {
        els.recordStatus.textContent = "录音权限未开启";
        els.recordLight.classList.remove("is-recording");
        els.recordButton.textContent = "开始录音";
      }
    });
    els.playRecordingButton.addEventListener("click", () => {
      els.recordingPlayer.play();
    });
    document.addEventListener("keydown", (event) => {
      if (event.target && ["INPUT", "SELECT", "TEXTAREA"].includes(event.target.tagName)) return;
      if (event.key === "ArrowLeft") selectRelative(-1);
      if (event.key === "ArrowRight") selectRelative(1);
      if (event.key === " ") {
        event.preventDefault();
        togglePlay();
      }
    });
  }

  function init() {
    if (!segments.length) {
      els.russianText.textContent = "Нет данных";
      els.chineseText.textContent = "没有找到段落数据";
      return;
    }
    const savedSpeed = localStorage.getItem(speedKey);
    if (savedSpeed) els.speedSelect.value = savedSpeed;
    bindEvents();
    renderList();
    updateProgress();
    selectSegment(0);
  }

  init();
})();
