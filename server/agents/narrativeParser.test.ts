import { describe, expect, it } from "vitest";
import { parseNarrative } from "./narrativeParser";

describe("Narrative Parser Agent", () => {
  const sampleText = `
    Chapter 1: The Beginning
    
    Rocky Balboa was a small-time boxer from Philadelphia. He lived in a cramped apartment 
    and worked as a debt collector for a local loan shark. His life was going nowhere until 
    he met Adrian Pennino, a shy pet store clerk who would change his life forever.
    
    One day, Rocky got the opportunity of a lifetime - a chance to fight the heavyweight 
    champion Apollo Creed. It was supposed to be an easy fight for Apollo, just a publicity 
    stunt. But Rocky saw it as his one shot at making something of himself.
    
    Chapter 2: Training
    
    Rocky trained harder than he ever had before. He ran through the streets of Philadelphia 
    at dawn, punched sides of beef in the meat locker, and pushed himself to his absolute 
    limits. Adrian supported him every step of the way, believing in him when no one else did.
    
    The night before the fight, Rocky told Adrian, "I just want to go the distance. Nobody's 
    ever gone the distance with Creed. If I can go that distance, then I'll know I'm not just 
    another bum from the neighborhood."
    
    Chapter 3: The Fight
    
    The fight was brutal. Rocky took a beating but refused to go down. Round after round, 
    he absorbed punishment but kept coming forward. Apollo was shocked - this nobody from 
    Philadelphia had heart. In the final round, both fighters were exhausted, but Rocky 
    had proven himself. He had gone the distance.
  `;

  it("should parse narrative text into structured data", async () => {
    const result = await parseNarrative(sampleText, 10, 3);

    expect(result).toBeDefined();
    expect(result.characters).toBeDefined();
    expect(result.locations).toBeDefined();
    expect(result.plotBeats).toBeDefined();
    expect(result.dialogue).toBeDefined();
  }, 30000); // 30 second timeout for LLM call

  it("should extract main characters", async () => {
    const result = await parseNarrative(sampleText, 10, 3);

    expect(result.characters.length).toBeGreaterThan(0);
    expect(result.characters.length).toBeLessThanOrEqual(3);
    
    const characterNames = result.characters.map(c => c.name.toLowerCase());
    expect(characterNames.some(name => name.includes("rocky"))).toBe(true);
  }, 30000);

  it("should identify locations", async () => {
    const result = await parseNarrative(sampleText, 10, 3);

    expect(result.locations.length).toBeGreaterThan(0);
    
    const locationsStr = result.locations.join(" ").toLowerCase();
    expect(locationsStr.includes("philadelphia") || locationsStr.includes("gym")).toBe(true);
  }, 30000);

  it("should extract plot beats with emotional tone", async () => {
    const result = await parseNarrative(sampleText, 10, 3);

    expect(result.plotBeats.length).toBeGreaterThan(0);
    expect(result.plotBeats.length).toBeLessThanOrEqual(10);
    
    result.plotBeats.forEach(beat => {
      expect(beat.chapter).toBeDefined();
      expect(beat.summary).toBeDefined();
      expect(beat.emotion).toBeDefined();
    });
  }, 30000);

  it("should enforce scene limit", async () => {
    const result = await parseNarrative(sampleText, 5, 3);

    expect(result.plotBeats.length).toBeLessThanOrEqual(5);
  }, 30000);

  it("should enforce character limit", async () => {
    const result = await parseNarrative(sampleText, 10, 2);

    expect(result.characters.length).toBeLessThanOrEqual(2);
  }, 30000);
});
