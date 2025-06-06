import { charactersMap } from "../constants/constants";
import { RobocropSettings } from "../types/types";
import { shouldTrackCharacter } from "./helpers";

// =============================================================================
// WRAP TEXT NODES
// =============================================================================

/*
This function wraps the provided text nodes in boundary-preserving spans.

By wrapping the text nodes in spans, we have an easily identifiable boundary to work with.

The boundary spans enable us to add or remove highlighting without affecting the text content/boundaries.
*/
export const wrapTextNodes = (textNodes: Text[]): HTMLSpanElement[] => {
  const wrappedSpans: HTMLSpanElement[] = [];

  textNodes.forEach((textNode, index) => {
    const parent = textNode.parentNode;
    if (!parent) return;

    const boundarySpan = document.createElement("span");
    boundarySpan.className = "robocrop-text-boundary";
    boundarySpan.setAttribute("data-boundary-id", index.toString());
    boundarySpan.setAttribute("data-original-text", textNode.textContent || "");
    boundarySpan.textContent = textNode.textContent;

    parent.replaceChild(boundarySpan, textNode);
    wrappedSpans.push(boundarySpan);
  });

  return wrappedSpans;
};

// =============================================================================
// WRAP CHARS IN SPANS
// =============================================================================

/*
This function receives the boundary spans and wraps individual the characters in spans, accoding to the settings provided.

It also adds the necessary attributes to the spans to identify the characters and their replacements.

It also adds the visual effects to the spans.

NOTE: some attributes are likely no longer in use. They were added at a time when i thought I would 'replace' the characters using saud attributes as a way to identify the characters. Later i realised it would be quicker and less complicated just to restore the page and loop the nodes again from scratch
*/

export const wrapChars = (
  boundarySpans: HTMLSpanElement[],
  settings: RobocropSettings
) => {
  let totalHighlighted = 0;

  boundarySpans.forEach((boundarySpan) => {
    const text = boundarySpan.textContent || "";
    if (!text) return;

    const fragments: Array<string | HTMLSpanElement> = [];
    let lastIndex = 0;
    let spanHighlighted = false;

    // Check each character
    for (let i = 0; i < text.length; i++) {
      // Get character at current index
      const char = text[i];

      // Check if character should be tracked
      if (shouldTrackCharacter(char, settings)) {
        // Get character data from charactersMap
        const charData = charactersMap[char];

        if (i > lastIndex) {
          fragments.push(text.substring(lastIndex, i));
        }

        // Create container for character span and crosshairs
        const charContainer = document.createElement("span");

        // Base classes for identification and counting
        charContainer.className = "robocrop-character";

        charContainer.classList.add("robocrop-styles");

        // Add the category as an attribute to the target span
        charContainer.setAttribute("data-category", charData.category);

        // Add the character as an attribute to the target span
        charContainer.setAttribute("data-character", char);

        // Add the replacement character as an attribute to the target span
        charContainer.setAttribute("data-replacement", charData.replacement);

        // Add the character code as an attribute to the target span
        //? charCodeAt(0) gets the Unicode code point of the first character. toString(16) converts the code point to a hexadecimal string
        charContainer.setAttribute(
          "data-char-code",
          char.charCodeAt(0).toString(16)
        );

        // Add the label as an attribute to the target span
        charContainer.setAttribute("data-label", charData.label);

        // Add the label as a title to the target span
        //? do we benefit from this AND data-label?
        charContainer.title = charData.label;

        // Create horizontal crosshair line
        const horizontalLine = document.createElement("div");
        horizontalLine.className = "crosshair-horizontal";
        charContainer.appendChild(horizontalLine);

        // Create vertical crosshair line
        const verticalLine = document.createElement("div");
        verticalLine.className = "crosshair-vertical";
        charContainer.appendChild(verticalLine);

        // Create text wrapper for the character
        const textWrapper = document.createElement("span");
        textWrapper.className = "text-wrapper";
        textWrapper.textContent = char;
        charContainer.appendChild(textWrapper);

        fragments.push(charContainer);
        lastIndex = i + 1;
        spanHighlighted = true;
        totalHighlighted++;
      }
    }

    // Only process this span if we found target characters
    if (spanHighlighted) {
      // Add remaining text
      if (lastIndex < text.length) {
        fragments.push(text.substring(lastIndex));
      }

      // Clear the boundary span and add our fragment (prevents dupes)
      boundarySpan.innerHTML = "";
      fragments.forEach((fragment) => {
        if (typeof fragment === "string") {
          boundarySpan.appendChild(document.createTextNode(fragment));
        } else {
          boundarySpan.appendChild(fragment);
        }
      });
    }
  });
};
