/**
 * ROADSAFE AI Machine Learning Models
 * - Multinomial Logistic Regression (with Softmax and Inverse Class Weights)
 * - Decision Tree Classifier (CART with Multi-Class & Weighted Gini)
 * - Random Forest Classifier (Bootstrap Ensemble with Feature Subsampling)
 * - Model Evaluation & Champion Selection (Macro F1)
 */

import {
  ConfusionMatrixData,
  ModelComparisonResult,
  ModelEvaluation,
  PreprocessedData,
  SeverityClass,
} from '../types';

export interface MLClassifier {
  name: 'Logistic Regression' | 'Decision Tree' | 'Random Forest';
  train(X: number[][], y: number[], weights: number[]): void;
  predictProba(x: number[]): [number, number, number];
  predict(x: number[]): number;
  getFeatureImportances(): number[];
}

/**
 * 1. Multinomial Logistic Regression with Softmax and Class Weights
 */
export class MultinomialLogisticRegression implements MLClassifier {
  name: 'Logistic Regression' = 'Logistic Regression';
  weights: number[][] = []; // [3][numFeatures]
  biases: number[] = [0, 0, 0];
  means: number[] = [];
  stds: number[] = [];

  constructor(private lr = 0.08, private epochs = 120, private l2 = 0.001) {}

  train(X: number[][], y: number[], classWeights: number[]): void {
    const N = X.length;
    if (N === 0) return;
    const D = X[0].length;

    // Standardization parameters for numerical features
    this.means = new Array(D).fill(0);
    this.stds = new Array(D).fill(1);
    for (let j = 0; j < D; j++) {
      let sum = 0;
      for (let i = 0; i < N; i++) sum += X[i][j];
      const mean = sum / N;
      let varSum = 0;
      for (let i = 0; i < N; i++) varSum += (X[i][j] - mean) ** 2;
      this.means[j] = mean;
      this.stds[j] = Math.sqrt(varSum / N) || 1;
    }

    // Standardize training data
    const X_std = X.map((row) =>
      row.map((val, j) => (val - this.means[j]) / this.stds[j])
    );

    // Initialize weights and biases
    this.weights = Array.from({ length: 3 }, () =>
      Array.from({ length: D }, () => (Math.random() - 0.5) * 0.01)
    );
    this.biases = [0, 0, 0];

    // Mini-batch or SGD with momentum
    const vW = Array.from({ length: 3 }, () => new Array(D).fill(0));
    const vb = [0, 0, 0];
    const momentum = 0.85;

    for (let epoch = 0; epoch < this.epochs; epoch++) {
      // Shuffle indices
      const indices = Array.from({ length: N }, (_, i) => i).sort(
        () => Math.random() - 0.5
      );

      const batchSize = Math.min(64, N);
      for (let b = 0; b < N; b += batchSize) {
        const batchIdxs = indices.slice(b, b + batchSize);
        const gradW = Array.from({ length: 3 }, () => new Array(D).fill(0));
        const gradB = [0, 0, 0];

        let batchWeightSum = 0;

        for (const i of batchIdxs) {
          const xi = X_std[i];
          const yi = y[i];
          const wSample = classWeights[yi] || 1;
          batchWeightSum += wSample;

          // Compute Softmax probabilities
          const logits = [0, 1, 2].map(
            (c) =>
              this.biases[c] +
              this.weights[c].reduce((sum, w, j) => sum + w * xi[j], 0)
          );
          const maxLogit = Math.max(...logits);
          const exps = logits.map((l) => Math.exp(l - maxLogit));
          const sumExps = exps.reduce((a, b) => a + b, 0);
          const probs = exps.map((e) => e / sumExps);

          for (let c = 0; c < 3; c++) {
            const error = (probs[c] - (yi === c ? 1 : 0)) * wSample;
            gradB[c] += error;
            for (let j = 0; j < D; j++) {
              gradW[c][j] += error * xi[j];
            }
          }
        }

        const denom = Math.max(1, batchWeightSum);
        for (let c = 0; c < 3; c++) {
          vb[c] = momentum * vb[c] + this.lr * (gradB[c] / denom);
          this.biases[c] -= vb[c];

          for (let j = 0; j < D; j++) {
            const reg = this.l2 * this.weights[c][j];
            gradW[c][j] = gradW[c][j] / denom + reg;
            vW[c][j] = momentum * vW[c][j] + this.lr * gradW[c][j];
            this.weights[c][j] -= vW[c][j];
          }
        }
      }
    }
  }

  predictProba(x: number[]): [number, number, number] {
    const x_std = x.map((val, j) =>
      this.stds[j] ? (val - this.means[j]) / this.stds[j] : 0
    );
    const logits = [0, 1, 2].map(
      (c) =>
        this.biases[c] +
        this.weights[c].reduce((sum, w, j) => sum + w * x_std[j], 0)
    );
    const maxLogit = Math.max(...logits);
    const exps = logits.map((l) => Math.exp(l - maxLogit));
    const sumExps = exps.reduce((a, b) => a + b, 0) || 1;
    return [exps[0] / sumExps, exps[1] / sumExps, exps[2] / sumExps];
  }

  predict(x: number[]): number {
    const probs = this.predictProba(x);
    if (probs[0] >= probs[1] && probs[0] >= probs[2]) return 0;
    if (probs[1] >= probs[0] && probs[1] >= probs[2]) return 1;
    return 2;
  }

  getFeatureImportances(): number[] {
    if (this.weights.length === 0) return [];
    const D = this.weights[0].length;
    const importance = new Array(D).fill(0);
    for (let j = 0; j < D; j++) {
      let mag = 0;
      for (let c = 0; c < 3; c++) {
        mag += Math.abs(this.weights[c][j]);
      }
      importance[j] = mag;
    }
    const sum = importance.reduce((a, b) => a + b, 0) || 1;
    return importance.map((val) => val / sum);
  }
}

/**
 * 2. Decision Tree Node & Classifier (CART with Multi-Class & Weighted Gini)
 */
interface TreeNode {
  isLeaf: boolean;
  prediction?: number;
  probabilities?: [number, number, number];
  featureIndex?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
}

export class DecisionTreeClassifier implements MLClassifier {
  name: 'Decision Tree' = 'Decision Tree';
  root: TreeNode | null = null;
  featureImportances: number[] = [];

  constructor(
    public maxDepth = 6,
    public minSamplesLeaf = 5,
    public featureSubsetRatio = 1.0 // for Random Forest subsampling
  ) {}

  train(X: number[][], y: number[], classWeights: number[]): void {
    const N = X.length;
    if (N === 0) return;
    const D = X[0].length;
    this.featureImportances = new Array(D).fill(0);

    const sampleWeights = y.map((label) => classWeights[label] || 1);
    const indices = Array.from({ length: N }, (_, i) => i);

    this.root = this.buildTree(X, y, sampleWeights, indices, 0, D);

    // Normalize feature importances
    const sum = this.featureImportances.reduce((a, b) => a + b, 0) || 1;
    this.featureImportances = this.featureImportances.map((val) => val / sum);
  }

  private calculateGini(
    y: number[],
    weights: number[],
    indices: number[]
  ): { gini: number; probs: [number, number, number]; totalWeight: number } {
    let w0 = 0,
      w1 = 0,
      w2 = 0;
    for (const idx of indices) {
      const label = y[idx];
      const w = weights[idx];
      if (label === 0) w0 += w;
      else if (label === 1) w1 += w;
      else w2 += w;
    }
    const total = w0 + w1 + w2;
    if (total === 0) return { gini: 0, probs: [0.33, 0.33, 0.34], totalWeight: 0 };
    const p0 = w0 / total;
    const p1 = w1 / total;
    const p2 = w2 / total;
    const gini = 1 - (p0 * p0 + p1 * p1 + p2 * p2);
    return { gini, probs: [p0, p1, p2], totalWeight: total };
  }

  private buildTree(
    X: number[][],
    y: number[],
    weights: number[],
    indices: number[],
    depth: number,
    numFeatures: number
  ): TreeNode {
    const { gini: nodeGini, probs, totalWeight } = this.calculateGini(
      y,
      weights,
      indices
    );

    // Argmax prediction
    let maxIdx = 0;
    if (probs[1] > probs[maxIdx]) maxIdx = 1;
    if (probs[2] > probs[maxIdx]) maxIdx = 2;

    // Stopping conditions
    if (
      depth >= this.maxDepth ||
      indices.length <= this.minSamplesLeaf ||
      nodeGini === 0
    ) {
      return {
        isLeaf: true,
        prediction: maxIdx,
        probabilities: probs,
      };
    }

    // Feature subset selection
    const featureIndices = Array.from({ length: numFeatures }, (_, i) => i);
    let candidateFeatures = featureIndices;
    if (this.featureSubsetRatio < 1.0) {
      const k = Math.max(1, Math.floor(numFeatures * this.featureSubsetRatio));
      candidateFeatures = featureIndices
        .sort(() => Math.random() - 0.5)
        .slice(0, k);
    }

    let bestGain = 0;
    let bestFeature = -1;
    let bestThreshold = 0;
    let bestLeftIndices: number[] = [];
    let bestRightIndices: number[] = [];

    for (const f of candidateFeatures) {
      // Find candidate thresholds
      const vals = indices.map((i) => X[i][f]);
      const uniqueVals = Array.from(new Set(vals)).sort((a, b) => a - b);
      if (uniqueVals.length <= 1) continue;

      // Check max 10 quantiles/thresholds for speed
      const step = Math.max(1, Math.floor(uniqueVals.length / 10));
      for (let v = 0; v < uniqueVals.length - 1; v += step) {
        const threshold = (uniqueVals[v] + uniqueVals[v + 1]) / 2;

        const left: number[] = [];
        const right: number[] = [];
        for (const i of indices) {
          if (X[i][f] <= threshold) left.push(i);
          else right.push(i);
        }

        if (
          left.length < this.minSamplesLeaf ||
          right.length < this.minSamplesLeaf
        ) {
          continue;
        }

        const leftGini = this.calculateGini(y, weights, left);
        const rightGini = this.calculateGini(y, weights, right);

        const weightedChildGini =
          (leftGini.totalWeight / totalWeight) * leftGini.gini +
          (rightGini.totalWeight / totalWeight) * rightGini.gini;

        const gain = nodeGini - weightedChildGini;

        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = f;
          bestThreshold = threshold;
          bestLeftIndices = left;
          bestRightIndices = right;
        }
      }
    }

    if (bestGain <= 0.0001 || bestFeature === -1) {
      return {
        isLeaf: true,
        prediction: maxIdx,
        probabilities: probs,
      };
    }

    // Accumulate feature importance
    this.featureImportances[bestFeature] += bestGain * totalWeight;

    const leftNode = this.buildTree(
      X,
      y,
      weights,
      bestLeftIndices,
      depth + 1,
      numFeatures
    );
    const rightNode = this.buildTree(
      X,
      y,
      weights,
      bestRightIndices,
      depth + 1,
      numFeatures
    );

    return {
      isLeaf: false,
      featureIndex: bestFeature,
      threshold: bestThreshold,
      left: leftNode,
      right: rightNode,
      prediction: maxIdx,
      probabilities: probs,
    };
  }

  predictProba(x: number[]): [number, number, number] {
    if (!this.root) return [0.33, 0.33, 0.34];
    let curr = this.root;
    while (!curr.isLeaf) {
      if (
        curr.featureIndex !== undefined &&
        curr.threshold !== undefined &&
        curr.left &&
        curr.right
      ) {
        if (x[curr.featureIndex] <= curr.threshold) {
          curr = curr.left;
        } else {
          curr = curr.right;
        }
      } else {
        break;
      }
    }
    return curr.probabilities || [0.33, 0.33, 0.34];
  }

  predict(x: number[]): number {
    const probs = this.predictProba(x);
    if (probs[0] >= probs[1] && probs[0] >= probs[2]) return 0;
    if (probs[1] >= probs[0] && probs[1] >= probs[2]) return 1;
    return 2;
  }

  getFeatureImportances(): number[] {
    return this.featureImportances;
  }
}

/**
 * 3. Random Forest Classifier (Bootstrap Ensemble with Feature Subsampling)
 */
export class RandomForestClassifier implements MLClassifier {
  name: 'Random Forest' = 'Random Forest';
  trees: DecisionTreeClassifier[] = [];
  featureImportances: number[] = [];

  constructor(
    public numTrees = 15,
    public maxDepth = 7,
    public minSamplesLeaf = 4
  ) {}

  train(X: number[][], y: number[], classWeights: number[]): void {
    const N = X.length;
    if (N === 0) return;
    const D = X[0].length;
    this.trees = [];
    this.featureImportances = new Array(D).fill(0);

    const featureSubsetRatio = Math.min(1.0, Math.sqrt(D) / D + 0.1);

    for (let t = 0; t < this.numTrees; t++) {
      // Balanced bootstrap sample
      const bootstrapX: number[][] = [];
      const bootstrapY: number[] = [];

      for (let i = 0; i < N; i++) {
        const randIdx = Math.floor(Math.random() * N);
        bootstrapX.push(X[randIdx]);
        bootstrapY.push(y[randIdx]);
      }

      const tree = new DecisionTreeClassifier(
        this.maxDepth,
        this.minSamplesLeaf,
        featureSubsetRatio
      );

      tree.train(bootstrapX, bootstrapY, classWeights);
      this.trees.push(tree);

      const treeImportances = tree.getFeatureImportances();
      for (let j = 0; j < D; j++) {
        this.featureImportances[j] += (treeImportances[j] || 0) / this.numTrees;
      }
    }

    const sum = this.featureImportances.reduce((a, b) => a + b, 0) || 1;
    this.featureImportances = this.featureImportances.map((val) => val / sum);
  }

  predictProba(x: number[]): [number, number, number] {
    if (this.trees.length === 0) return [0.33, 0.33, 0.34];
    let p0 = 0,
      p1 = 0,
      p2 = 0;

    for (const tree of this.trees) {
      const [t0, t1, t2] = tree.predictProba(x);
      p0 += t0;
      p1 += t1;
      p2 += t2;
    }

    const total = this.trees.length;
    const avg0 = p0 / total;
    const avg1 = p1 / total;
    const avg2 = p2 / total;
    const sum = avg0 + avg1 + avg2 || 1;
    return [avg0 / sum, avg1 / sum, avg2 / sum];
  }

  predict(x: number[]): number {
    const probs = this.predictProba(x);
    if (probs[0] >= probs[1] && probs[0] >= probs[2]) return 0;
    if (probs[1] >= probs[0] && probs[1] >= probs[2]) return 1;
    return 2;
  }

  getFeatureImportances(): number[] {
    return this.featureImportances;
  }
}

/**
 * Evaluates a model on test partition and computes full metrics,
 * confusion matrix, and feature importances.
 */
export function evaluateModel(
  model: MLClassifier,
  X_test: number[][],
  y_test: number[],
  featureNames: string[],
  trainingTimeMs: number
): ModelEvaluation {
  const N = y_test.length;
  // 3x3 confusion matrix: matrix[actual][predicted]
  const matrix: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];

  let correct = 0;
  for (let i = 0; i < N; i++) {
    const actual = y_test[i];
    const predicted = model.predict(X_test[i]);
    matrix[actual][predicted]++;
    if (actual === predicted) correct++;
  }

  const accuracy = N > 0 ? Number((correct / N).toFixed(4)) : 0;

  // Compute per-class precision, recall, f1
  const classNames: SeverityClass[] = ['Slight', 'Serious', 'Fatal'];
  const classMetricsRecord: Record<SeverityClass, { precision: number; recall: number; f1: number; support: number }> = {
    Slight: { precision: 0, recall: 0, f1: 0, support: 0 },
    Serious: { precision: 0, recall: 0, f1: 0, support: 0 },
    Fatal: { precision: 0, recall: 0, f1: 0, support: 0 },
  };

  let macroPrecisionSum = 0;
  let macroRecallSum = 0;
  let macroF1Sum = 0;

  for (let c = 0; c < 3; c++) {
    const tp = matrix[c][c];
    const fp = matrix[(c + 1) % 3][c] + matrix[(c + 2) % 3][c];
    const fn = matrix[c][(c + 1) % 3] + matrix[c][(c + 2) % 3];
    const support = matrix[c][0] + matrix[c][1] + matrix[c][2];

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 =
      precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    classMetricsRecord[classNames[c]] = {
      precision: Number(precision.toFixed(4)),
      recall: Number(recall.toFixed(4)),
      f1: Number(f1.toFixed(4)),
      support,
    };

    macroPrecisionSum += precision;
    macroRecallSum += recall;
    macroF1Sum += f1;
  }

  const macroPrecision = Number((macroPrecisionSum / 3).toFixed(4));
  const macroRecall = Number((macroRecallSum / 3).toFixed(4));
  const macroF1 = Number((macroF1Sum / 3).toFixed(4));

  // Feature Importance mapping
  const rawImportances = model.getFeatureImportances();
  const featureImportance = featureNames.map((name, idx) => ({
    feature: name,
    importance: Number(((rawImportances[idx] || 0) * 100).toFixed(2)),
  }));
  // Sort descending
  featureImportance.sort((a, b) => b.importance - a.importance);

  const confusionMatrix: ConfusionMatrixData = {
    matrix,
    labels: classNames,
    totalSamples: N,
  };

  return {
    modelName: model.name,
    accuracy,
    macroPrecision,
    macroRecall,
    macroF1,
    classMetrics: classMetricsRecord,
    confusionMatrix,
    trainingTimeMs,
    featureImportance,
  };
}

/**
 * Trains all 3 models, evaluates them, and selects the champion based on Macro F1.
 */
export function trainAndCompareAllModels(
  preprocessed: PreprocessedData,
  onProgress?: (step: string, percent: number) => void
): {
  comparison: ModelComparisonResult;
  models: {
    lr: MultinomialLogisticRegression;
    dt: DecisionTreeClassifier;
    rf: RandomForestClassifier;
  };
  championModel: MLClassifier;
} {
  const { X_train, y_train, X_test, y_test, stats, featureNames } = preprocessed;
  const weightsArr = [
    stats.classWeights.Slight,
    stats.classWeights.Serious,
    stats.classWeights.Fatal,
  ];

  // 1. Train Logistic Regression
  onProgress?.('Training Logistic Regression with Softmax & Balanced Loss...', 25);
  const t0 = performance.now();
  const lr = new MultinomialLogisticRegression(0.08, 120, 0.001);
  lr.train(X_train, y_train, weightsArr);
  const lrTime = Math.round(performance.now() - t0);
  const lrEval = evaluateModel(lr, X_test, y_test, featureNames, lrTime);

  // 2. Train Decision Tree
  onProgress?.('Building CART Decision Tree with Weighted Gini Impurity...', 50);
  const t1 = performance.now();
  const dt = new DecisionTreeClassifier(6, 5);
  dt.train(X_train, y_train, weightsArr);
  const dtTime = Math.round(performance.now() - t1);
  const dtEval = evaluateModel(dt, X_test, y_test, featureNames, dtTime);

  // 3. Train Random Forest
  onProgress?.('Constructing Random Forest Ensemble (15 Bootstrap Trees)...', 80);
  const t2 = performance.now();
  const rf = new RandomForestClassifier(15, 7, 4);
  rf.train(X_train, y_train, weightsArr);
  const rfTime = Math.round(performance.now() - t2);
  const rfEval = evaluateModel(rf, X_test, y_test, featureNames, rfTime);

  const evaluations: ModelEvaluation[] = [lrEval, dtEval, rfEval];

  // 4. Select Champion by Macro F1
  evaluations.sort((a, b) => b.macroF1 - a.macroF1);
  const championEvaluation = evaluations[0];
  const championModelName = championEvaluation.modelName;

  let championModel: MLClassifier = rf;
  if (championModelName === 'Logistic Regression') championModel = lr;
  else if (championModelName === 'Decision Tree') championModel = dt;

  onProgress?.('Model evaluation and champion selection complete!', 100);

  return {
    comparison: {
      evaluations,
      championModelName,
      championEvaluation,
    },
    models: { lr, dt, rf },
    championModel,
  };
}
