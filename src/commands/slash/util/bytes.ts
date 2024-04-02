export default class Bytes {
  units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  declare x: number;
  declare index: number;
  declare bytes: string;
  declare unit: string;

  constructor(x: number) {
    this.x = x;
    this.index = this._index;
    this.bytes = this._bytes;
    this.unit = this._unit;
  }

  get _index() {
    if (!this.x) return 0;
    return Math.floor(Math.log(this.x) / Math.log(1000));
  }

  get _bytes() {
    if (!this.x) return "0.00";
    return (this.x / Math.pow(1024, this.index)).toFixed(2);
  }

  get _unit() {
    return this.units[this.index];
  }

  toArray() {
    return [Number(this.bytes), this.unit];
  }

  toString() {
    return `${this.bytes} ${this.unit}`;
  }

  toJSON() {
    return {
      bytes: Number(this.bytes),
      unit: this.unit,
    };
  }

  *[Symbol.iterator]() {
    yield* this.toArray();
  }
}