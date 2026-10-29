import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render } from "@testing-library/react";

// jsdom has no text-to-speech, so a fake one is installed before speech.js
// is imported (it checks for support once, at import time).
const synth = vi.hoisted(() => {
  globalThis.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text;
    }
  };
  const fake = { utterances: [], cancel: () => {}, speak: (u) => fake.utterances.push(u) };
  window.speechSynthesis = fake;
  return fake;
});

const { speak, getSpokenText } = await import("../lib/speech");
const { SpeakerIcon } = await import("./SpeakerIcon");

const last = () => synth.utterances.at(-1);

describe("<SpeakerIcon>", () => {
  afterEach(() => act(() => last()?.onend()));

  it("animates only the icon of the word being spoken, until it ends", () => {
    const { container } = render(
      <>
        <SpeakerIcon text="hola" />
        <SpeakerIcon text="adiós" />
      </>,
    );
    const [hola, adios] = container.querySelectorAll("svg");
    expect(hola).not.toHaveClass("speaking");

    speak("hola", "es");
    act(() => last().onstart());
    expect(hola).toHaveClass("speaking");
    expect(adios).not.toHaveClass("speaking");

    act(() => last().onend());
    expect(hola).not.toHaveClass("speaking");
  });

  it("ignores the late end of an utterance that was replaced", () => {
    speak("hola", "es");
    const first = last();
    act(() => first.onstart());
    speak("adiós", "es");
    act(() => last().onstart());

    // cancel() can fire the old utterance's "end" after the new one started.
    act(() => first.onend());
    expect(getSpokenText()).toBe("adiós");
  });

  it("clears the state when speaking fails", () => {
    speak("hola", "es");
    act(() => last().onstart());
    act(() => last().onerror());
    expect(getSpokenText()).toBeNull();
  });
});
