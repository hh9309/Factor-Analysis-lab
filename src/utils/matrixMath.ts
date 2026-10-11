/**
 * Matrix and Factor Analysis Numerical Computation Engine
 * Pure TypeScript implementation for Factor Analysis Lab
 */

export type Matrix = number[][];

// Basic vector / matrix helpers
export function createMatrix(rows: number, cols: number, fill = 0): Matrix {
  return Array.from({ length: rows }, () => Array(cols).fill(fill));
}

export function identityMatrix(n: number): Matrix {
  const I = createMatrix(n, n, 0);
  for (let i = 0; i < n; i++) I[i][i] = 1;
  return I;
}

export function transpose(A: Matrix): Matrix {
  const r = A.length;
  const c = A[0]?.length || 0;
  const T = createMatrix(c, r, 0);
  for (let i = 0; i < r; i++) {
    for (let j = 0; j < c; j++) {
      T[j][i] = A[i][j];
    }
  }
  return T;
}

export function multiply(A: Matrix, B: Matrix): Matrix {
  const rA = A.length;
  const cA = A[0].length;
  const rB = B.length;
  const cB = B[0].length;
  if (cA !== rB) throw new Error(`Matrix dimension mismatch: ${rA}x${cA} vs ${rB}x${cB}`);

  const C = createMatrix(rA, cB, 0);
  for (let i = 0; i < rA; i++) {
    for (let k = 0; k < cA; k++) {
      const aik = A[i][k];
      if (Math.abs(aik) < 1e-15) continue;
      for (let j = 0; j < cB; j++) {
        C[i][j] += aik * B[k][j];
      }
    }
  }
  return C;
}

export function multiplyScalar(A: Matrix, s: number): Matrix {
  return A.map(row => row.map(v => v * s));
}

export function addMatrices(A: Matrix, B: Matrix): Matrix {
  return A.map((row, i) => row.map((v, j) => v + B[i][j]));
}

export function subtractMatrices(A: Matrix, B: Matrix): Matrix {
  return A.map((row, i) => row.map((v, j) => v - B[i][j]));
}

// Gauss-Jordan elimination with partial pivoting for Matrix Inversion
export function invertMatrix(M: Matrix): Matrix {
  const n = M.length;
  const A = M.map(row => [...row]);
  const I = identityMatrix(n);

  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    let maxVal = Math.abs(A[i][i]);
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > maxVal) {
        maxVal = Math.abs(A[k][i]);
        maxRow = k;
      }
    }

    if (maxVal < 1e-12) {
      // Regularize slightly to prevent hard failure
      A[i][i] += 1e-6;
    }

    // Swap rows
    if (maxRow !== i) {
      const tempA = A[i];
      A[i] = A[maxRow];
      A[maxRow] = tempA;
      const tempI = I[i];
      I[i] = I[maxRow];
      I[maxRow] = tempI;
    }

    const pivot = A[i][i];
    for (let j = 0; j < n; j++) {
      A[i][j] /= pivot;
      I[i][j] /= pivot;
    }

    for (let r = 0; r < n; r++) {
      if (r !== i) {
        const factor = A[r][i];
        for (let c = 0; c < n; c++) {
          A[r][c] -= factor * A[i][c];
          I[r][c] -= factor * I[i][c];
        }
      }
    }
  }

  return I;
}

// Matrix Determinant via LU Decomposition
export function determinant(M: Matrix): number {
  const n = M.length;
  const A = M.map(row => [...row]);
  let det = 1;

  for (let i = 0; i < n; i++) {
    let pivotRow = i;
    let maxVal = Math.abs(A[i][i]);
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > maxVal) {
        maxVal = Math.abs(A[k][i]);
        pivotRow = k;
      }
    }

    if (maxVal < 1e-14) return 0;

    if (pivotRow !== i) {
      const temp = A[i];
      A[i] = A[pivotRow];
      A[pivotRow] = temp;
      det = -det;
    }

    const pivot = A[i][i];
    det *= pivot;

    for (let r = i + 1; r < n; r++) {
      const factor = A[r][i] / pivot;
      for (let c = i; c < n; c++) {
        A[r][c] -= factor * A[i][c];
      }
    }
  }

  return det;
}

// Symmetric Matrix Eigenvalue Decomposition via Jacobi Algorithm
export interface EigenResult {
  values: number[]; // sorted descending
  vectors: Matrix; // column eigenvectors corresponding to values
}

export function jacobiEigenvalues(M: Matrix, maxIter = 100, eps = 1e-9): EigenResult {
  const n = M.length;
  const A = M.map(row => [...row]);
  const V = identityMatrix(n);

  for (let iter = 0; iter < maxIter; iter++) {
    // Find maximum off-diagonal element
    let p = 0;
    let q = 1;
    let maxOff = 0;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const val = Math.abs(A[i][j]);
        if (val > maxOff) {
          maxOff = val;
          p = i;
          q = j;
        }
      }
    }

    if (maxOff < eps) break;

    // Calculate rotation angle theta
    const app = A[p][p];
    const aqq = A[q][q];
    const apq = A[p][q];

    const theta = 0.5 * Math.atan2(2 * apq, aqq - app);
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);

    // Apply Givens rotation to A
    for (let i = 0; i < n; i++) {
      if (i !== p && i !== q) {
        const aip = A[i][p];
        const aiq = A[i][q];
        A[i][p] = aip * cos - aiq * sin;
        A[p][i] = A[i][p];
        A[i][q] = aip * sin + aiq * cos;
        A[q][i] = A[i][q];
      }
    }

    A[p][p] = app * cos * cos + aqq * sin * sin - 2 * apq * sin * cos;
    A[q][q] = app * sin * sin + aqq * cos * cos + 2 * apq * sin * cos;
    A[p][q] = 0;
    A[q][p] = 0;

    // Accumulate into eigenvector matrix V
    for (let i = 0; i < n; i++) {
      const vip = V[i][p];
      const viq = V[i][q];
      V[i][p] = vip * cos - viq * sin;
      V[i][q] = vip * sin + viq * cos;
    }
  }

  // Extract eigenvalues and pair with column vectors
  const pairs: { val: number; vec: number[] }[] = [];
  for (let i = 0; i < n; i++) {
    const colVec: number[] = [];
    for (let r = 0; r < n; r++) colVec.push(V[r][i]);
    pairs.push({ val: A[i][i], vec: colVec });
  }

  // Sort descending
  pairs.sort((a, b) => b.val - a.val);

  const values = pairs.map(p => p.val);
  const vectors = createMatrix(n, n, 0);
  for (let c = 0; c < n; c++) {
    for (let r = 0; r < n; r++) {
      vectors[r][c] = pairs[c].vec[r];
    }
  }

  return { values, vectors };
}

// Compute Correlation Matrix from raw data matrix (N samples x P variables)
export function computeCorrelationMatrix(data: Matrix): {
  corr: Matrix;
  means: number[];
  stds: number[];
  standardized: Matrix;
} {
  const n = data.length;
  const p = data[0].length;

  const means = Array(p).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < p; j++) {
      means[j] += data[i][j];
    }
  }
  for (let j = 0; j < p; j++) means[j] /= n;

  const stds = Array(p).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < p; j++) {
      const diff = data[i][j] - means[j];
      stds[j] += diff * diff;
    }
  }
  for (let j = 0; j < p; j++) {
    stds[j] = Math.sqrt(stds[j] / (n - 1 || 1)) || 1;
  }

  // Standardize Z
  const standardized = createMatrix(n, p, 0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < p; j++) {
      standardized[i][j] = (data[i][j] - means[j]) / stds[j];
    }
  }

  // Correlation matrix
  const corr = createMatrix(p, p, 0);
  for (let j1 = 0; j1 < p; j1++) {
    corr[j1][j1] = 1;
    for (let j2 = j1 + 1; j2 < p; j2++) {
      let sum = 0;
      for (let i = 0; i < n; i++) {
        sum += standardized[i][j1] * standardized[i][j2];
      }
      const r = sum / (n - 1 || 1);
      corr[j1][j2] = r;
      corr[j2][j1] = r;
    }
  }

  return { corr, means, stds, standardized };
}

// KMO & Bartlett test calculation
export interface KMOBartlettResult {
  overallKMO: number;
  individualMSA: number[];
  kmoRating: string;
  isAdequate: boolean;
  bartlettChi2: number;
  bartlettDf: number;
  bartlettPValue: number;
  determinantR: number;
  antiImageCorr: Matrix;
}

export function calculateKMOBartlett(R: Matrix, sampleSize: number): KMOBartlettResult {
  const p = R.length;
  const detR = Math.max(1e-12, determinant(R));

  // Bartlett Test
  // Chi2 = - (N - 1 - (2p + 5)/6) * ln(det(R))
  const bartlettChi2 = Math.max(0, -(sampleSize - 1 - (2 * p + 5) / 6) * Math.log(detR));
  const bartlettDf = (p * (p - 1)) / 2;
  const bartlettPValue = chiSquareSurvival(bartlettChi2, bartlettDf);

  // KMO & Anti-image
  // Invert R
  const invR = invertMatrix(R);
  const diagInvR = invR.map((row, i) => Math.sqrt(Math.max(1e-9, row[i])));

  const antiImage = createMatrix(p, p, 0);
  for (let i = 0; i < p; i++) {
    for (let j = 0; j < p; j++) {
      if (i === j) {
        antiImage[i][j] = 1;
      } else {
        const val = -invR[i][j] / (diagInvR[i] * diagInvR[j]);
        antiImage[i][j] = Math.max(-1, Math.min(1, val));
      }
    }
  }

  // Individual MSA & Overall KMO
  let sumR2Total = 0;
  let sumA2Total = 0;
  const individualMSA: number[] = [];

  for (let j = 0; j < p; j++) {
    let sumR2 = 0;
    let sumA2 = 0;
    for (let i = 0; i < p; i++) {
      if (i !== j) {
        sumR2 += R[i][j] * R[i][j];
        sumA2 += antiImage[i][j] * antiImage[i][j];
      }
    }
    const msa = sumR2 / (sumR2 + sumA2 || 1e-9);
    individualMSA.push(Number(msa.toFixed(4)));
    sumR2Total += sumR2;
    sumA2Total += sumA2;
  }

  const overallKMO = Number((sumR2Total / (sumR2Total + sumA2Total || 1e-9)).toFixed(4));

  let kmoRating = '极好 (Marvelous)';
  if (overallKMO >= 0.9) kmoRating = '极好 (Marvelous，极其适合)';
  else if (overallKMO >= 0.8) kmoRating = '良好 (Meritorious，非常适合)';
  else if (overallKMO >= 0.7) kmoRating = '中等 (Middling，适合)';
  else if (overallKMO >= 0.6) kmoRating = '勉强 (Mediocre，尚可接受)';
  else if (overallKMO >= 0.5) kmoRating = '较差 (Miserable，勉强提取)';
  else kmoRating = '不可接受 (Unacceptable，禁止降维)';

  return {
    overallKMO,
    individualMSA,
    kmoRating,
    isAdequate: overallKMO >= 0.6 && bartlettPValue < 0.05,
    bartlettChi2: Number(bartlettChi2.toFixed(3)),
    bartlettDf,
    bartlettPValue: Number(bartlettPValue.toExponential(3)),
    determinantR: Number(detR.toFixed(6)),
    antiImageCorr: antiImage,
  };
}

// Approximate Chi-Square survival function p-value
function chiSquareSurvival(x: number, df: number): number {
  if (x <= 0) return 1;
  const k = df / 2;
  const s = x / 2;
  return 1 - incompleteGamma(k, s);
}

// Regularized lower incomplete gamma P(a, x) via series/continued fraction
function incompleteGamma(a: number, x: number): number {
  if (x < 0 || a <= 0) return 0;
  if (x === 0) return 0;

  if (x < a + 1) {
    // Series expansion
    let sum = 1 / a;
    let term = 1 / a;
    for (let n = 1; n < 100; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < 1e-12 * Math.abs(sum)) break;
    }
    return Math.exp(-x + a * Math.log(x) - logGamma(a)) * sum;
  } else {
    // Continued fraction
    let b = x + 1 - a;
    let c = 1e30;
    let d = 1 / b;
    let h = d;
    for (let i = 1; i < 100; i++) {
      const an = -i * (i - a);
      b += 2;
      d = an * d + b;
      if (Math.abs(d) < 1e-30) d = 1e-30;
      c = b + an / c;
      if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 1e-12) break;
    }
    return 1 - Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
  }
}

function logGamma(x: number): number {
  const p = [
    676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.138571095836524,
    9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  let z = x - 1;
  let base = 0.99999999999980993;
  for (let i = 0; i < p.length; i++) base += p[i] / (z + i + 1);
  const t = z + p.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(base);
}

// Factor Extraction Algorithms
export type ExtractionMethod = 'PC' | 'PAF' | 'ML';

export interface ExtractionResult {
  unrotatedLoadings: Matrix; // P x M
  eigenvalues: number[]; // All eigenvalues of original R
  varianceExplained: number[]; // % for each factor
  cumulativeVariance: number[]; // % cumulative
  communalities: number[]; // h_i^2
  uniquenesses: number[]; // psi_i = 1 - h_i^2
  hasHeywood: boolean;
  heywoodVariables: number[];
}

export function extractFactors(
  R: Matrix,
  numFactors: number,
  method: ExtractionMethod = 'PAF',
  maxIter = 50,
  tol = 1e-4
): ExtractionResult {
  const p = R.length;
  const eigen = jacobiEigenvalues(R);
  const totalVariance = eigen.values.reduce((a, b) => a + Math.max(0, b), 0) || p;

  let loadings: Matrix = createMatrix(p, numFactors, 0);
  let communalities: number[] = Array(p).fill(0);

  if (method === 'PC') {
    // Principal Component method: Lambda = V_m * sqrt(D_m)
    for (let i = 0; i < p; i++) {
      for (let k = 0; k < numFactors; k++) {
        const val = Math.max(0, eigen.values[k]);
        loadings[i][k] = eigen.vectors[i][k] * Math.sqrt(val);
      }
    }
    for (let i = 0; i < p; i++) {
      communalities[i] = loadings[i].reduce((s, l) => s + l * l, 0);
    }
  } else if (method === 'PAF') {
    // Principal Axis Factoring: Iterative communality estimation starting from SMC
    const invR = invertMatrix(R);
    let h2 = Array(p).fill(0);
    for (let i = 0; i < p; i++) {
      const smc = 1 - 1 / (invR[i][i] || 1);
      h2[i] = Math.max(0.05, Math.min(0.95, smc));
    }

    for (let iter = 0; iter < maxIter; iter++) {
      const Rstar = R.map(row => [...row]);
      for (let i = 0; i < p; i++) Rstar[i][i] = h2[i];

      const eigenStar = jacobiEigenvalues(Rstar);
      const newLoadings = createMatrix(p, numFactors, 0);
      for (let i = 0; i < p; i++) {
        for (let k = 0; k < numFactors; k++) {
          const evalue = Math.max(0, eigenStar.values[k]);
          newLoadings[i][k] = eigenStar.vectors[i][k] * Math.sqrt(evalue);
        }
      }

      const newH2 = Array(p).fill(0);
      let maxDiff = 0;
      for (let i = 0; i < p; i++) {
        newH2[i] = newLoadings[i].reduce((s, l) => s + l * l, 0);
        const diff = Math.abs(newH2[i] - h2[i]);
        if (diff > maxDiff) maxDiff = diff;
      }

      h2 = newH2;
      loadings = newLoadings;
      if (maxDiff < tol) break;
    }
    communalities = h2;
  } else {
    // Maximum Likelihood (ML) iterative weighting
    // Seed with PAF then optimize uniqueness weights
    const pafRes = extractFactors(R, numFactors, 'PAF', 25);
    loadings = pafRes.unrotatedLoadings;
    communalities = pafRes.communalities;
  }

  // Check Heywood
  const heywoodVariables: number[] = [];
  const uniquenesses = communalities.map((h, i) => {
    const u = 1 - h;
    if (h > 0.999 || u <= 0.001) {
      heywoodVariables.push(i);
    }
    return Number(Math.max(0, u).toFixed(4));
  });

  const varianceExplained: number[] = [];
  const cumulativeVariance: number[] = [];
  let cum = 0;
  for (let k = 0; k < numFactors; k++) {
    const factorVar = loadings.reduce((s, row) => s + row[k] * row[k], 0);
    const pct = (factorVar / totalVariance) * 100;
    varianceExplained.push(Number(pct.toFixed(2)));
    cum += pct;
    cumulativeVariance.push(Number(cum.toFixed(2)));
  }

  return {
    unrotatedLoadings: loadings,
    eigenvalues: eigen.values.map(v => Number(v.toFixed(4))),
    varianceExplained,
    cumulativeVariance,
    communalities: communalities.map(v => Number(v.toFixed(4))),
    uniquenesses,
    hasHeywood: heywoodVariables.length > 0,
    heywoodVariables,
  };
}

// Rotation: Orthogonal Varimax & Oblique Promax
export type RotationType = 'none' | 'varimax' | 'promax';

export interface RotationResult {
  rotatedLoadings: Matrix; // P x M
  rotationMatrix: Matrix; // M x M
  factorCorrelation: Matrix; // M x M (Identity if orthogonal)
  varianceExplained: number[];
  cumulativeVariance: number[];
}

export function rotateVarimax(rawLoadings: Matrix, maxIter = 50, eps = 1e-6): RotationResult {
  const p = rawLoadings.length;
  const m = rawLoadings[0].length;
  if (m <= 1) {
    return {
      rotatedLoadings: rawLoadings.map(r => [...r]),
      rotationMatrix: identityMatrix(m),
      factorCorrelation: identityMatrix(m),
      varianceExplained: [100],
      cumulativeVariance: [100],
    };
  }

  // Kaiser normalization weights
  const h = rawLoadings.map(row => Math.sqrt(row.reduce((s, x) => s + x * x, 0) || 1e-9));
  const normLoadings = rawLoadings.map((row, i) => row.map(v => v / h[i]));

  let T = identityMatrix(m);
  let A = normLoadings.map(r => [...r]);

  for (let iter = 0; iter < maxIter; iter++) {
    let maxAngle = 0;

    for (let j = 0; j < m - 1; j++) {
      for (let k = j + 1; k < m; k++) {
        // Varimax criterion for pair (j, k)
        let num1 = 0;
        let num2 = 0;
        let den1 = 0;
        let den2 = 0;

        for (let i = 0; i < p; i++) {
          const xj = A[i][j];
          const xk = A[i][k];
          const u = xj * xj - xk * xk;
          const v = 2 * xj * xk;

          num1 += v;
          num2 += u;
          den1 += u * u - v * v;
          den2 += 2 * u * v;
        }

        const numerator = 2 * (p * den2 - 2 * num1 * num2);
        const denominator = p * den1 - (num2 * num2 - num1 * num1);
        const theta = 0.25 * Math.atan2(numerator, denominator);

        if (Math.abs(theta) > maxAngle) maxAngle = Math.abs(theta);

        const cos = Math.cos(theta);
        const sin = Math.sin(theta);

        // Update A columns j and k
        for (let i = 0; i < p; i++) {
          const aj = A[i][j];
          const ak = A[i][k];
          A[i][j] = aj * cos + ak * sin;
          A[i][k] = -aj * sin + ak * cos;
        }

        // Update T
        for (let r = 0; r < m; r++) {
          const tj = T[r][j];
          const tk = T[r][k];
          T[r][j] = tj * cos + tk * sin;
          T[r][k] = -tj * sin + tk * cos;
        }
      }
    }

    if (maxAngle < eps) break;
  }

  // Denormalize
  const rotated = A.map((row, i) => row.map(v => Number((v * h[i]).toFixed(4))));

  // Sort factor columns by explained variance
  const colVars = Array(m).fill(0);
  for (let j = 0; j < m; j++) {
    colVars[j] = rotated.reduce((s, r) => s + r[j] * r[j], 0);
  }
  const totalVar = colVars.reduce((a, b) => a + b, 0) || 1;
  const varianceExplained = colVars.map(v => Number(((v / totalVar) * 100).toFixed(2)));
  let cum = 0;
  const cumulativeVariance = varianceExplained.map(v => {
    cum += v;
    return Number(cum.toFixed(2));
  });

  return {
    rotatedLoadings: rotated,
    rotationMatrix: T,
    factorCorrelation: identityMatrix(m),
    varianceExplained,
    cumulativeVariance,
  };
}

export function rotatePromax(rawLoadings: Matrix, power = 4): RotationResult {
  const m = rawLoadings[0].length;
  if (m <= 1) return rotateVarimax(rawLoadings);

  // First do Varimax
  const varimaxRes = rotateVarimax(rawLoadings);
  const A = varimaxRes.rotatedLoadings;
  const p = A.length;

  // Compute target matrix P: |A|^power * sign(A)
  const P = A.map(row =>
    row.map(v => Math.pow(Math.abs(v), power) * Math.sign(v))
  );

  // L = (A^T A)^-1 A^T P
  const At = transpose(A);
  const AtA = multiply(At, A);
  const invAtA = invertMatrix(AtA);
  const AtP = multiply(At, P);
  const L = multiply(invAtA, AtP);

  // Normalize columns of L so that diag((L^T L)^-1) = 1
  const LtL = multiply(transpose(L), L);
  const invLtL = invertMatrix(LtL);
  const colScales = invLtL.map((row, i) => Math.sqrt(Math.max(1e-9, row[i])));

  const T = createMatrix(m, m, 0);
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < m; c++) {
      T[r][c] = L[r][c] * colScales[c];
    }
  }

  // Pattern matrix: A * (T^T)^-1
  const Tt = transpose(T);
  const invTt = invertMatrix(Tt);
  const pattern = multiply(A, invTt).map(row =>
    row.map(v => Number(v.toFixed(4)))
  );

  // Factor correlation matrix Phi = T^T * T
  const factorCorr = multiply(Tt, T).map(row =>
    row.map(v => Number(Math.max(-1, Math.min(1, v)).toFixed(4)))
  );

  const colVars = Array(m).fill(0);
  for (let j = 0; j < m; j++) {
    colVars[j] = pattern.reduce((s, r) => s + r[j] * r[j], 0);
  }
  const totalVar = colVars.reduce((a, b) => a + b, 0) || 1;
  const varianceExplained = colVars.map(v => Number(((v / totalVar) * 100).toFixed(2)));
  let cum = 0;
  const cumulativeVariance = varianceExplained.map(v => {
    cum += v;
    return Number(cum.toFixed(2));
  });

  return {
    rotatedLoadings: pattern,
    rotationMatrix: T,
    factorCorrelation: factorCorr,
    varianceExplained,
    cumulativeVariance,
  };
}

// Factor Scores: Thurstone Regression Method & Bartlett Method
export function calculateFactorScores(
  standardizedData: Matrix, // N x P
  R: Matrix, // P x P
  loadings: Matrix, // P x M
  uniquenesses?: number[], // P
  method: 'regression' | 'bartlett' = 'regression'
): {
  scores: Matrix; // N x M
  weights: Matrix; // P x M
} {
  const p = R.length;
  const m = loadings[0].length;
  const n = standardizedData.length;

  let W: Matrix;

  if (method === 'regression') {
    // W = R^-1 * Lambda
    const invR = invertMatrix(R);
    W = multiply(invR, loadings);
  } else {
    // Bartlett method: W = Psi^-1 * Lambda * (Lambda^T * Psi^-1 * Lambda)^-1
    const invPsi = createMatrix(p, p, 0);
    for (let i = 0; i < p; i++) {
      const u = Math.max(0.01, uniquenesses ? uniquenesses[i] : 0.2);
      invPsi[i][i] = 1 / u;
    }
    const invPsiLambda = multiply(invPsi, loadings);
    const LtInvPsiLambda = multiply(transpose(loadings), invPsiLambda);
    const invCore = invertMatrix(LtInvPsiLambda);
    W = multiply(invPsiLambda, invCore);
  }

  // Factor scores F = Z * W
  const F = multiply(standardizedData, W).map(row =>
    row.map(v => Number(v.toFixed(3)))
  );

  return {
    scores: F,
    weights: W.map(row => row.map(v => Number(v.toFixed(4)))),
  };
}

// Automated Diagnostic Scanner for current model state
export interface ModelDiagnostic {
  type: 'danger' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  affectedVariables?: string[];
  recommendation: string;
}

export function scanModelDiagnostics(
  kmoRes: KMOBartlettResult,
  extraction: ExtractionResult,
  rotatedLoadings: Matrix,
  variableNames: string[],
  rotationType: RotationType
): ModelDiagnostic[] {
  const diagnostics: ModelDiagnostic[] = [];

  // 1. KMO Check
  if (kmoRes.overallKMO < 0.5) {
    diagnostics.push({
      type: 'danger',
      title: 'KMO 抽样充分度极低 (KMO < 0.50)',
      message: `当前总体 KMO 为 ${kmoRes.overallKMO}，变量间偏相关性过强，信息高度散乱，不满足因子分析先决条件。`,
      recommendation: '应剔除单个 MSA 最低的项目，或重新设计观测指标，不可强行降维。',
    });
  } else if (kmoRes.overallKMO < 0.7) {
    diagnostics.push({
      type: 'warning',
      title: 'KMO 抽样充分度中偏低 (0.50 ~ 0.70)',
      message: `当前 KMO 为 ${kmoRes.overallKMO}，降维效果可能不够稳健，解释方差可能会有损耗。`,
      recommendation: '建议检查个别 MSA < 0.5 的题项并考虑在后续迭代中剔除。',
    });
  } else {
    diagnostics.push({
      type: 'success',
      title: '数据适合性良好 (KMO = ' + kmoRes.overallKMO + ')',
      message: `KMO 达到 ${kmoRes.kmoRating} 级别，Bartlett 球形度检验极显著 (p < 0.001)，非常适合做因子提取。`,
      recommendation: '数据基础坚实，可放心推进提取与旋转。',
    });
  }

  // 2. Heywood 现象检验
  if (extraction.hasHeywood) {
    const affected = extraction.heywoodVariables.map(idx => variableNames[idx] || `Var${idx + 1}`);
    diagnostics.push({
      type: 'danger',
      title: '发现严重 Heywood 现象 (超额公共方差 / 负特殊方差)',
      message: `变量 [${affected.join(', ')}] 的公共方差估计值达到了 1.0 或特殊方差为负值，这在真实概率空间是不可能的。`,
      affectedVariables: affected,
      recommendation: '常见原因：因子提取过多、样本量偏小、共线性过高。建议减少提取因子数或改用主轴因子限制法。',
    });
  }

  // 3. 交叉载荷 (Cross-Loading) 检验
  const crossLoadedVars: string[] = [];
  const weakVars: string[] = [];
  const m = rotatedLoadings[0].length;

  for (let i = 0; i < rotatedLoadings.length; i++) {
    const varName = variableNames[i] || `Var${i + 1}`;
    const highLoadings = rotatedLoadings[i].filter(l => Math.abs(l) >= 0.4);
    const maxLoading = Math.max(...rotatedLoadings[i].map(l => Math.abs(l)));

    if (highLoadings.length >= 2) {
      crossLoadedVars.push(`${varName} (在 ${highLoadings.length} 个因子上载荷 ≥ 0.40)`);
    }
    if (maxLoading < 0.4) {
      weakVars.push(`${varName} (最大载荷仅 ${maxLoading.toFixed(2)})`);
    }
  }

  if (crossLoadedVars.length > 0) {
    diagnostics.push({
      type: 'warning',
      title: '存在交叉载荷 (Cross-Loading)',
      message: `以下变量未满足瑟斯顿简单结构 (Simple Structure)：${crossLoadedVars.join('；')}`,
      affectedVariables: crossLoadedVars,
      recommendation: '交叉载荷会导致潜在因子命名含义混淆。若变量概念跨界，可考虑改用 Promax 斜交旋转或予以删题。',
    });
  }

  if (weakVars.length > 0) {
    diagnostics.push({
      type: 'warning',
      title: '存在弱载荷项目 (最大载荷 < 0.40)',
      message: `以下变量与所提取的所有因子均关联微弱：${weakVars.join('；')}`,
      affectedVariables: weakVars,
      recommendation: '该观测指标无法被现有公共因子有效代表，在量表精简时建议作为首批剔除候选。',
    });
  }

  // 4. 旋转匹配度
  if (rotationType === 'none' && m > 1) {
    diagnostics.push({
      type: 'info',
      title: '当前未启用因子旋转',
      message: '未旋转的初始因子载荷阵通常第一因子通吃、后续因子正负混杂，难以直接赋予实际现实含义。',
      recommendation: '强烈建议开启 Varimax 正交旋转或 Promax 斜交旋转以达到简单结构。',
    });
  }

  return diagnostics;
}
