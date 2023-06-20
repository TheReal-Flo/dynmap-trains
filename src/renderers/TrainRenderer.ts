import { Renderer } from "../types/Renderer";
import { Train, TrainPoint } from "../types/APITypes";
import { NEG_POS, addPoints, getDirectionalVector, getPerpendicularVector, multPoints } from "../utils";

/** Offset the train down 1 block so the train doesn't float above the tracks */
const TRAIN_OFFSET: TrainPoint = { x: 0, y: -1, z: 0 };

export class TrainRenderer extends Renderer<Train, L.SVGOverlay> {
  render(_train: Train) {
    const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svgElement.setAttribute("viewBox", "0 0 200 200");
    svgElement.innerHTML = '<g><g transform="rotate(-90)"></g></g>';

    const object = L.svgOverlay(
      svgElement,
      [
        [0, 0],
        [0, 0],
      ],
      {
        interactive: true,
      },
    );

    return object;
  }

  update(train: Train, object: L.SVGOverlay) {
    const svgElement = object.getElement()!;
    const outerG = svgElement.childNodes[0] as SVGGElement;
    const innerG = outerG.childNodes[0] as SVGGElement;

    const ll = (point: TrainPoint): L.LatLng => this.dynmap.getProjection().fromLocationToLatLng(point);

    for (let i = 0; i < train.cars.length; i++) {
      const car = train.cars[i];

      if (
        car.leading.dimension != this.config.worlds[this.dynmap.world.name] ||
        car.trailing.dimension != this.config.worlds[this.dynmap.world.name]
      )
        continue;

      // This element is used for displaying animated train
      let viewPath = innerG.childNodes[i * 2] as SVGPathElement;
      // This element is used to properly calulate the bounding box
      let calcPath = innerG.childNodes[i * 2 + 1] as SVGPathElement;
      // If the car wasn't rendered yet, create the elements
      if (!viewPath) {
        viewPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        calcPath = viewPath.cloneNode() as SVGPathElement;

        calcPath.style.opacity = "0";

        innerG.appendChild(viewPath);
        innerG.appendChild(calcPath);
      }

      // Translate points
      const leading = car.leading.location;
      const trailing = car.trailing.location;

      // Create a delta vector
      const vector = getDirectionalVector(leading, trailing, 1);

      // Create an in-direction offset
      const offset = multPoints(vector, 0.5);
      const negOffset = multPoints(offset, NEG_POS);

      // Create a perpendicular offset
      const offsetPerp = multPoints(getPerpendicularVector(vector), this.config.trainWidth * 0.5);
      const negOffsetPerp = multPoints(offsetPerp, NEG_POS);

      // Create the polygon points
      const points = [
        addPoints(leading, addPoints(offsetPerp, offset)),
        addPoints(leading, addPoints(negOffsetPerp, offset)),
        addPoints(trailing, addPoints(negOffsetPerp, negOffset)),
        addPoints(trailing, addPoints(offsetPerp, negOffset)),
      ];

      // Add direction arrow
      let isLead = false;
      if (!train.stopped) {
        if (train.backwards && i == train.cars.length - 1) {
          points.splice(3, 0, addPoints(trailing, multPoints(multPoints(vector, NEG_POS), this.config.trainWidth)));
          isLead = true;
        } else if (i == 0) {
          points.splice(1, 0, addPoints(leading, multPoints(vector, this.config.trainWidth)));
          isLead = true;
        }
      }

      // Update style
      viewPath.style.transition = `all ${Math.min(1, this.config.updateInterval)}s linear`;
      viewPath.style.fill = isLead ? "var(--lead-car-color)" : "var(--train-color)";

      // Update the shape
      const d = points
        .map((v, i) => {
          // Apply offfset and convert to latLan
          const _v = ll(addPoints(v, TRAIN_OFFSET));
          return `${i ? "L" : "M"} ${_v.lat},${_v.lng}`;
        })
        .join(" ");
      viewPath.setAttribute("d", d);
      calcPath.setAttribute("d", d);
    }

    // Calculate needed space and location
    const startLatLng = ll(train.cars[0].leading.location);
    const outerBox = outerG.getBBox();
    const innerBbox = innerG.getBBox();

    // Update svg viewBox
    svgElement.setAttribute("viewBox", `${outerBox.x} ${outerBox.y} ${outerBox.width} ${outerBox.height}`);

    // Update rotation center
    outerG.setAttribute(
      "transform-origin",
      `${innerBbox.x + innerBbox.width / 2} ${innerBbox.y + innerBbox.height / 2}`,
    );

    // Update svg location
    object.setBounds(
      L.latLngBounds([
        L.latLng(innerBbox.x, innerBbox.y, startLatLng.alt),
        L.latLng(innerBbox.x + innerBbox.width, innerBbox.y + innerBbox.height, startLatLng.alt),
      ]),
    );
  }
}
