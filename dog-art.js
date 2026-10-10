(() => {
  "use strict";

  // All actions reuse one 32 x 24 design and one nine-color palette.
  const colors = {
    outline: "#4b2b25", shadow: "#a9532b", orange: "#df8439",
    light: "#f3ad57", creamShadow: "#d9b27d", cream: "#fff0c0",
    collar: "#c74342", gold: "#f7c54e", eye: "#241f22",
  };

  function frameFor(action, frame) {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 24;
    const pen = canvas.getContext("2d");
    pen.imageSmoothingEnabled = false;
    function box(color, x, y, width, height) {
      pen.fillStyle = colors[color];
      pen.fillRect(x, y, width, height);
    }
    const walking = action === "walk";
    const step = frame % 6;
    const bob = walking && (step === 1 || step === 4) ? -1 : 0;
    const tailLift = action === "jump" || action === "fall" ? -1 : Math.floor(frame / 5) % 2;
    pen.save();
    pen.translate(0, bob);

    box("outline", 3, 10 + tailLift, 5, 4);
    box("outline", 6, 12 + tailLift, 5, 5);
    box("orange", 4, 11 + tailLift, 4, 2);
    box("orange", 7, 13 + tailLift, 4, 2);
    box("cream", 3, 10 + tailLift, 2, 2);

    const rearStep = walking ? [0, 1, 1, 0, -1, -1][step] : 0;
    const frontStep = walking ? [0, -1, -1, 0, 1, 1][step] : 0;
    const pawY = action === "jump" ? 19 : 21;
    box("outline", 12 + rearStep, 17, 3, pawY - 16);
    box("shadow", 13 + rearStep, 18, 1, pawY - 18);
    box("outline", 18 + frontStep, 17, 3, pawY - 16);
    box("creamShadow", 19 + frontStep, 18, 1, pawY - 18);

    box("outline", 9, 10, 13, 10);
    box("outline", 7, 13, 3, 5);
    box("shadow", 8, 14, 13, 4);
    box("orange", 10, 11, 12, 7);
    box("light", 11, 11, 9, 2);
    box("creamShadow", 14, 18, 8, 1);
    box("cream", 15, 17, 7, 2);

    const nearRear = walking ? [0, -1, -2, 0, 1, 1][step] : 0;
    const nearFront = walking ? [0, 1, 1, 0, -1, -2][step] : 0;
    if (action === "jump") {
      box("outline", 10, 18, 5, 3);
      box("cream", 11, 19, 3, 1);
      box("outline", 20, 18, 5, 3);
      box("cream", 21, 19, 3, 1);
    } else {
      box("outline", 10 + nearRear, 17, 4, 5);
      box("orange", 11 + nearRear, 17, 2, 3);
      box("cream", 10 + nearRear, 20, 4, 1);
      box("outline", 20 + nearFront, 17, 4, 5);
      box("creamShadow", 21 + nearFront, 17, 2, 3);
      box("cream", 20 + nearFront, 20, 4, 1);
    }

    box("outline", 20, 2, 4, 8);
    box("orange", 21, 3, 2, 6);
    box("creamShadow", 22, 4, 1, 3);
    box("outline", 25, 4, 3, 6);
    box("orange", 26, 5, 1, 4);
    box("outline", 20, 7, 9, 9);
    box("orange", 21, 8, 7, 6);
    box("light", 22, 8, 5, 2);
    box("creamShadow", 24, 12, 5, 4);
    box("cream", 25, 12, 5, 3);
    box("outline", 28, 13, 3, 3);
    box("cream", 28, 13, 2, 2);
    box("eye", 30, 12, 1, 2);
    box("eye", 25, 10, 2, 2);
    box("cream", 25, 10, 1, 1);
    box("eye", 28, 15, 2, 1);
    box("collar", 20, 15, 5, 2);
    box("gold", 23, 17, 2, 2);
    box("outline", 24, 18, 1, 1);

    pen.restore();
    return canvas;
  }

  window.createDogAnimations = () => Object.fromEntries(
    ["idle", "walk", "jump", "fall"].map((action) => [
      action, Array.from({ length: 30 }, (_, frame) => frameFor(action, frame)),
    ])
  );
})();
