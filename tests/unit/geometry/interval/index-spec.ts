import { getCoordinate } from '@antv/coord';
import { Canvas } from '@antv/g';
import { isNumberEqual } from '@antv/util';
import Interval from '../../../../src/geometry/interval';
import { createDiv, removeDom } from '../../../util/dom';
import Theme from '../../../util/theme';

import 'jest-extended';

const CartesianCoordinate = getCoordinate('rect');

describe('Interval', () => {
  const div = createDiv();
  const canvas = new Canvas({
    containerDOM: div,
    renderer: 'canvas',
    width: 200,
    height: 200,
    pixelRatio: 2,
  });
  const rectCoord = new CartesianCoordinate({
    start: { x: 0, y: 180 },
    end: { x: 180, y: 0 },
  });

  describe('Default', () => {
    let interval;
    const data = [{ a: 'A', b: 10 }, { a: 'B', b: 12 }, { a: 'C', b: 8 }];

    let dataArray;

    test('Instantiate with empty config', () => {
      interval = new Interval({
        container: canvas.addGroup(),
      });
      expect(interval.type).toBe('interval');
      expect(interval.shapeType).toBe('interval');
      expect(interval.generatePoints).toBe(true);
      expect(interval.visible).toBe(true);
    });

    test('initial()', () => {
      interval = new Interval({
        data,
        scaleDefs: {
          a: { range: [0.25, 0.75] },
        },
        coordinate: rectCoord,
        container: canvas.addGroup(),
        theme: Theme,
      });

      interval.position('a*b').color('a');
      interval.initial();

      const attributes = interval.attributes;
      expect(attributes).toContainKeys(['position', 'color']);

      dataArray = interval.dataArray;
      expect(dataArray.length).toBe(3);
      expect(dataArray[0][0].a).toBe(0);
      expect(dataArray[1][0].a).toBe(1);
      expect(dataArray[2][0].a).toBe(2);
    });

    test('yScale min adjust', () => {
      // 柱状图 Y 轴应该从 0 开始生长
      const yScale = interval.getYScale();
      expect(yScale.min).toBe(0);
    });

    test('createShapePointsCfg', () => {
      const result = interval.createShapePointsCfg(dataArray[0][0]);
      expect(result.size).toBe(1 / 6);
      expect(interval.defaultSize).toBe(1 / 6);
    });

    test('beforeMapping', () => {
      interval.beforeMapping(dataArray);

      // 会生成 nextPoints
      expect(dataArray[0][0].points).not.toBe(undefined);
      expect(dataArray[0][0].nextPoints).not.toBe(undefined);
      expect(dataArray[1][0].points).not.toBe(undefined);
      expect(dataArray[1][0].nextPoints).not.toBe(undefined);
      expect(dataArray[2][0].points).not.toBe(undefined);
      expect(dataArray[2][0].nextPoints).toBe(undefined);
    });

    test('paint()', () => {
      interval.paint();
      canvas.draw();

      const elements = interval.elements;
      expect(elements.length).toBe(3);

      const container = interval.container;
      expect(container.get('children').length).toBe(3);
    });

    test('clear()', () => {
      interval.clear();
      expect(interval.defaultSize).toBe(undefined);
    });

    test('interval.size(20)', () => {
      interval.size(20); // 指定 interval 的宽度

      interval.initial();
      interval.paint();

      expect(interval.defaultSize).toBe(undefined);
      const intervalShape = interval.elements[0].shape;
      const intervalShapeBBox = intervalShape.getBBox();
      expect(isNumberEqual(intervalShapeBBox.width, 20)).toBe(true);
    });

    test('limit the width with minColumnWidth', () => {
      interval.clear();
      interval.theme.minColumnWidth = 40;

      interval.size(null);
      interval.initial();
      interval.paint();

      canvas.draw();

      const elements = interval.elements;
      expect(isNumberEqual(elements[0].shape.getBBox().width, 40)).toBe(true);
      expect(isNumberEqual(elements[1].shape.getBBox().width, 40)).toBe(true);
      expect(isNumberEqual(elements[2].shape.getBBox().width, 40)).toBe(true);
    });

    test('limit the width with maxColumnWidth', () => {
      interval.clear();
      interval.theme.maxColumnWidth = 10;
      interval.theme.minColumnWidth = null;

      interval.initial();
      interval.paint();

      canvas.draw();

      const elements = interval.elements;
      expect(isNumberEqual(elements[0].shape.getBBox().width, 10)).toBe(true);
      expect(isNumberEqual(elements[1].shape.getBBox().width, 10)).toBe(true);
      expect(isNumberEqual(elements[2].shape.getBBox().width, 10)).toBe(true);
    });

    test('destroy()', () => {
      interval.destroy();

      expect(interval.container.destroyed).toBe(true);
    });
  });

  describe('yScale adjust', () => {
    const interval = new Interval({
      data: [{ a: 'A', b: 10 }, { a: 'B', b: 12 }, { a: 'C', b: 8 }],
      scaleDefs: {
        a: { range: [0.25, 0.75] },
        b: { min: 7 },
      },
      coordinate: rectCoord,
      container: canvas.addGroup(),
      theme: Theme,
    });

    interval.position('a*b');

    it('yScale min adjust when user define min', () => {
      interval.initial();
      // 为了观察最终的绘制结果
      interval.paint();
      canvas.draw();

      const yScale = interval.getYScale();
      expect(yScale.min).not.toBe(0);
    });

    test('yScale max adjust when user do not define max', () => {
      interval.scaleDefs.b = undefined;
      interval.updateData([{ a: 'A', b: -10 }, { a: 'B', b: -12 }, { a: 'C', b: -8 }]);
      // 为了观察最终的绘制结果
      interval.paint();
      canvas.draw();

      expect(interval.getYScale().max).toBe(0);
    });

    test('yScale max adjust when user define max', () => {
      interval.scaleDefs.b = {
        max: 5,
      };
      interval.updateData([{ a: 'A', b: -10 }, { a: 'B', b: -12 }, { a: 'C', b: -8 }]);
      // 为了观察最终的绘制结果
      interval.paint();
      canvas.draw();

      expect(interval.getYScale().max).toBe(5);
    });

    test('yScale will not be adjusted when type is time', () => {
      interval.scaleDefs.b = null;
      interval.updateData([{ a: 'A', b: '2019-10-01' }, { a: 'B', b: '2019-10-02' }, { a: 'C', b: '2019-10-03' }]);

      const yScale = interval.getYScale();
      expect(yScale.type).toBe('time');
      expect(yScale.min).not.toBe(0);
    });
  });

  afterAll(() => {
    canvas.destroy();
    removeDom(div);
  });
});
