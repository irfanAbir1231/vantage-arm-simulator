// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

export function isSpeechRecognitionAvailable(): boolean {
  return typeof window !== "undefined" && "SpeechRecognition" in window;
}
