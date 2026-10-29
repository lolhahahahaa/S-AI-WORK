// Ambient sound generated live with the Web Audio API — no recorded or
// copyrighted tracks, and no streaming service.

export type Soundscape = 'focus' | 'lofi' | 'nature' | 'instrumental'

export const soundscapes: { id: Soundscape; label: string; desc: string }[] = [
  { id: 'focus', label: 'Focus', desc: 'Soft brown noise with a low hum' },
  { id: 'lofi', label: 'Lo-fi', desc: 'Warm chord pad with gentle crackle' },
  { id: 'nature', label: 'Nature', desc: 'Rain with the odd bird' },
  { id: 'instrumental', label: 'Instrumental', desc: 'Slow, calm piano-like notes' },
]

class AmbientEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private nodes: AudioNode[] = []
  private timers: number[] = []
  private volume = 0.5

  private ensure() {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.volume * 0.6
      this.master.connect(this.ctx.destination)
    }
    return { ctx: this.ctx, master: this.master! }
  }

  private noise(kind: 'brown' | 'pink') {
    const { ctx } = this.ensure()
    const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate)
    const d = buf.getChannelData(0)
    let last = 0
    let b0 = 0, b1 = 0, b2 = 0
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1
      if (kind === 'brown') {
        last = (last + 0.02 * w) / 1.02
        d[i] = last * 3.2
      } else {
        b0 = 0.99765 * b0 + w * 0.099
        b1 = 0.963 * b1 + w * 0.2965
        b2 = 0.57 * b2 + w * 1.0526
        d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.12
      }
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.loop = true
    return src
  }

  private tone(freq: number, at: number, dur: number, type: OscillatorType, gain: number, dest: AudioNode) {
    const { ctx } = this.ensure()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = type
    o.frequency.value = freq
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(gain, at + Math.min(0.4, dur / 3))
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    o.connect(g).connect(dest)
    o.start(at)
    o.stop(at + dur + 0.05)
  }

  play(kind: Soundscape) {
    this.stop()
    const { ctx, master } = this.ensure()
    void ctx.resume()
    const bus = ctx.createGain()
    bus.gain.setValueAtTime(0, ctx.currentTime)
    bus.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.2)
    bus.connect(master)
    this.nodes.push(bus)

    if (kind === 'focus') {
      const n = this.noise('brown')
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 520
      n.connect(lp).connect(bus)
      n.start()
      const hum = ctx.createOscillator()
      const hg = ctx.createGain()
      hum.frequency.value = 110
      hg.gain.value = 0.025
      hum.connect(hg).connect(bus)
      hum.start()
      this.nodes.push(n, lp, hum, hg)
    }

    if (kind === 'nature') {
      const n = this.noise('pink')
      const bp = ctx.createBiquadFilter()
      bp.type = 'highpass'
      bp.frequency.value = 900
      const g = ctx.createGain()
      g.gain.value = 0.9
      n.connect(bp).connect(g).connect(bus)
      n.start()
      this.nodes.push(n, bp, g)
      const chirp = () => {
        const t = ctx.currentTime
        const base = 2400 + Math.random() * 1400
        for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
          const o = ctx.createOscillator()
          const og = ctx.createGain()
          const at = t + i * 0.16
          o.frequency.setValueAtTime(base, at)
          o.frequency.exponentialRampToValueAtTime(base * 1.4, at + 0.09)
          og.gain.setValueAtTime(0, at)
          og.gain.linearRampToValueAtTime(0.035, at + 0.02)
          og.gain.exponentialRampToValueAtTime(0.0001, at + 0.12)
          o.connect(og).connect(bus)
          o.start(at)
          o.stop(at + 0.14)
        }
      }
      this.timers.push(window.setInterval(() => Math.random() < 0.5 && chirp(), 3500))
    }

    if (kind === 'lofi') {
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 1200
      lp.connect(bus)
      this.nodes.push(lp)
      const chords = [
        [261.63, 329.63, 392, 493.88],
        [220, 261.63, 329.63, 392],
        [174.61, 220, 261.63, 329.63],
        [196, 246.94, 293.66, 349.23],
      ]
      let i = 0
      const next = () => {
        const t = ctx.currentTime
        chords[i++ % chords.length].forEach((f) => this.tone(f, t, 4.2, 'triangle', 0.035, lp))
      }
      next()
      this.timers.push(window.setInterval(next, 4000))
      const crackle = this.noise('pink')
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 3000
      const cg = ctx.createGain()
      cg.gain.value = 0.08
      crackle.connect(hp).connect(cg).connect(bus)
      crackle.start()
      this.nodes.push(crackle, hp, cg)
    }

    if (kind === 'instrumental') {
      const scale = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33]
      const rev = ctx.createBiquadFilter()
      rev.type = 'lowpass'
      rev.frequency.value = 2400
      rev.connect(bus)
      this.nodes.push(rev)
      const note = () => {
        const f = scale[Math.floor(Math.random() * scale.length)]
        this.tone(f, ctx.currentTime, 2.4, 'sine', 0.09, rev)
        if (Math.random() < 0.3) this.tone(f / 2, ctx.currentTime, 3, 'sine', 0.05, rev)
      }
      note()
      this.timers.push(window.setInterval(note, 900))
    }
  }

  setVolume(v: number) {
    this.volume = v
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(v * 0.6, this.ctx.currentTime, 0.05)
  }

  stop() {
    this.timers.forEach(clearInterval)
    this.timers = []
    this.nodes.forEach((n) => {
      try {
        if ('stop' in n) (n as AudioScheduledSourceNode).stop()
        n.disconnect()
      } catch {
        /* already stopped */
      }
    })
    this.nodes = []
  }
}

export const ambient = new AmbientEngine()
