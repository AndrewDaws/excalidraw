import type { ExcalidrawElement } from "../../element/types";
import DragInput from "./DragInput";
import type { DragInputCallbackType } from "./DragInput";
import { getStepSizedValue, isPropertyEditable } from "./utils";
import { mutateElement } from "../../element/mutateElement";

interface DimensionDragInputProps {
  property: "width" | "height";
  element: ExcalidrawElement;
}

const STEP_SIZE = 10;
const _shouldKeepAspectRatio = (element: ExcalidrawElement) => {
  return element.type === "image";
};

const newOrigin = (
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  w2: number,
  h2: number,
  angle: number,
) => {
  /**
   * The formula below is the result of solving
   *   rotate(x1, y1, cx1, cy1, angle) = rotate(x2, y2, cx2, cy2, angle)
   * where rotate is the function defined in math.ts
   *
   * This is so that the new origin (x2, y2),
   * when rotated against the new center (cx2, cy2),
   * coincides with (x1, y1) rotated against (cx1, cy1)
   *
   * The reason for doing this computation is so the element's top left corner
   * on the canvas remains fixed after any changes in its dimension.
   */

  return {
    x:
      x1 +
      (w1 - w2) / 2 +
      ((w2 - w1) / 2) * Math.cos(angle) +
      ((h1 - h2) / 2) * Math.sin(angle),
    y:
      y1 +
      (h1 - h2) / 2 +
      ((w2 - w1) / 2) * Math.sin(angle) +
      ((h2 - h1) / 2) * Math.cos(angle),
  };
};

const DimensionDragInput = ({ property, element }: DimensionDragInputProps) => {
  const handleDimensionChange: DragInputCallbackType = (
    accumulatedChange,
    instantChange,
    stateAtStart,
    shouldKeepAspectRatio,
    shouldChangeByStepSize,
    nextValue,
  ) => {
    if (stateAtStart) {
      const keepAspectRatio =
        shouldKeepAspectRatio || _shouldKeepAspectRatio(element);
      const aspectRatio = stateAtStart.width / stateAtStart.height;

      if (nextValue !== undefined) {
        const nextWidth = Math.max(
          property === "width"
            ? nextValue
            : keepAspectRatio
            ? nextValue * aspectRatio
            : stateAtStart.width,
          0,
        );
        const nextHeight = Math.max(
          property === "height"
            ? nextValue
            : keepAspectRatio
            ? nextValue / aspectRatio
            : stateAtStart.height,
          0,
        );

        mutateElement(element, {
          ...newOrigin(
            element.x,
            element.y,
            element.width,
            element.height,
            nextWidth,
            nextHeight,
            element.angle,
          ),
          width: nextWidth,
          height: nextHeight,
        });
        return;
      }
      const changeInWidth = property === "width" ? accumulatedChange : 0;
      const changeInHeight = property === "height" ? accumulatedChange : 0;

      let nextWidth = Math.max(0, stateAtStart.width + changeInWidth);
      if (property === "width") {
        if (shouldChangeByStepSize) {
          nextWidth = getStepSizedValue(nextWidth, STEP_SIZE);
        } else {
          nextWidth = Math.round(nextWidth);
        }
      }

      let nextHeight = Math.max(0, stateAtStart.height + changeInHeight);
      if (property === "height") {
        if (shouldChangeByStepSize) {
          nextHeight = getStepSizedValue(nextHeight, STEP_SIZE);
        } else {
          nextHeight = Math.round(nextHeight);
        }
      }

      if (keepAspectRatio) {
        if (property === "width") {
          nextHeight = Math.round((nextWidth / aspectRatio) * 100) / 100;
        } else {
          nextWidth = Math.round(nextHeight * aspectRatio * 100) / 100;
        }
      }

      mutateElement(element, {
        width: nextWidth,
        height: nextHeight,
        ...newOrigin(
          stateAtStart.x,
          stateAtStart.y,
          stateAtStart.width,
          stateAtStart.height,
          nextWidth,
          nextHeight,
          stateAtStart.angle,
        ),
      });
    }
  };

  return (
    <DragInput
      label={property === "width" ? "W" : "H"}
      element={element}
      dragInputCallback={handleDimensionChange}
      value={
        Math.round(
          (property === "width" ? element.width : element.height) * 100,
        ) / 100
      }
      editable={isPropertyEditable(element, property)}
    />
  );
};

export default DimensionDragInput;