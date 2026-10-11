/**
 * Code Engine for Python & R Factor Analysis Scripts
 * Generates both industrial library code and from-scratch matrix algebra code
 * All plot titles, legends, and axes are standardized in English.
 */

interface CodeGenParams {
  caseName: string;
  variableNames: string[];
  numFactors: number;
  method: 'PAF' | 'PC' | 'ML';
  rotation: 'varimax' | 'promax' | 'none';
  sampleSize: number;
}

export function generatePythonLibraryCode(params: CodeGenParams): string {
  const { caseName, variableNames, numFactors, method, rotation } = params;
  // In Python's factor_analyzer package, valid methods are: ['ml', 'mle', 'uls', 'minres', 'principal']
  // PAF (Principal Axis Factoring) corresponds to 'minres' (Minimum Residual / iterated factoring)
  // ML corresponds to 'ml', and PC corresponds to 'principal'
  const pyMethod = method === 'PAF' ? 'minres' : method === 'ML' ? 'ml' : 'principal';
  const pyRotation = rotation === 'none' ? 'None' : `'${rotation}'`;

  return `"""
Factor Analysis Production Pipeline - Python (factor_analyzer & matplotlib)
Case: ${caseName}
Variables: ${variableNames.join(', ')}
All plot titles, legends, and axes are formatted in English.
Compatible with Python 3.9 - 3.13 and pandas 1.x / 2.x
"""
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# 0. Robust import across factor_analyzer versions (0.3.x - 0.5.x)
try:
    from factor_analyzer import FactorAnalyzer, calculate_kmo, calculate_bartlett_sphericity
except (ImportError, AttributeError):
    try:
        from factor_analyzer.factor_analyzer import FactorAnalyzer, calculate_kmo, calculate_bartlett_sphericity
    except (ImportError, AttributeError):
        from factor_analyzer import FactorAnalyzer
        calculate_kmo, calculate_bartlett_sphericity = None, None

# Matplotlib internationalization & font settings
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'SimHei', 'Microsoft YaHei', 'sans-serif']
plt.rcParams['axes.unicode_minus'] = False

# 1. Load observation dataset
columns = ${JSON.stringify(variableNames, null, 2)}
# To load your real dataset, uncomment the line below:
# df = pd.read_csv('factor_data.csv')[columns]

# Generating realistic correlated observations with underlying factor structure
np.random.seed(42)
n_samples = max(150, len(columns) * 15)
k_latent = max(2, min(${numFactors}, max(1, len(columns) - 1)))
f_true = np.random.randn(n_samples, k_latent)

# Synthetic loading pattern to guarantee valid correlation structure
weights = np.zeros((len(columns), k_latent))
for i in range(len(columns)):
    f_idx = i % k_latent
    weights[i, f_idx] = 0.72 + (i % 3) * 0.06
    weights[i, (f_idx + 1) % k_latent] = 0.18

noise = np.random.randn(n_samples, len(columns)) * 0.35
sim_data = np.dot(f_true, weights.T) + noise + 5.0
df = pd.DataFrame(sim_data, columns=columns)

# 2. Data Suitability Tests (KMO & Bartlett's Test of Sphericity)
if calculate_bartlett_sphericity is not None and calculate_kmo is not None:
    try:
        chi_square_value, p_value = calculate_bartlett_sphericity(df)
        kmo_all, kmo_model = calculate_kmo(df)
        print("=" * 65)
        print(f"Bartlett's Test of Sphericity: Chi2 = {chi_square_value:.3f}, p-value = {p_value:.4e}")
        print(f"Overall Kaiser-Meyer-Olkin (KMO) Measure: {kmo_model:.4f}")
        print("=" * 65)
        if kmo_model < 0.60:
            print("Notice: KMO < 0.60, sample correlation structure is moderate/weak.")
    except Exception as err:
        print(f"Suitability diagnostics note: {err}")
else:
    print("Notice: calculate_kmo / calculate_bartlett_sphericity not found in factor_analyzer installation.")

# 3. Initial Unrotated Factor Extraction for Scree Plot
# Method 'principal' calculates full exact eigenvalues of the correlation matrix
try:
    fa_initial = FactorAnalyzer(n_factors=len(columns), method='principal', rotation=None)
    fa_initial.fit(df)
    ev, v = fa_initial.get_eigenvalues()
except Exception:
    # Direct linear algebra fallback: eigenvalues of sample correlation matrix R
    corr_matrix = df.corr().values
    ev = np.sort(np.linalg.eigvalsh(corr_matrix))[::-1]

print("\\nEigenvalues (λ):", np.round(ev, 4))

# 4. Formal Factor Extraction and Rotation
# Valid methods in factor_analyzer: ['minres', 'ml', 'mle', 'uls', 'principal']
# - PAF (Principal Axis Factoring) -> 'minres' (Minimum Residual)
# - ML (Maximum Likelihood) -> 'ml'
# - PC (Principal Component) -> 'principal'
safe_n_factors = min(${numFactors}, max(1, len(columns) - 1))
fa = FactorAnalyzer(
    n_factors=safe_n_factors,
    method='${pyMethod}',
    rotation=${pyRotation}
)
fa.fit(df)

# 5. Rotated Factor Loadings Matrix
num_extracted = fa.loadings_.shape[1]
loadings = pd.DataFrame(
    fa.loadings_,
    index=columns,
    columns=[f"Factor_{i+1}" for i in range(num_extracted)]
)
print("\\n[Rotated Factor Loadings Matrix]:")
print(loadings.round(4))

# 6. Communalities and Unique Variances (Compatible across factor_analyzer versions)
if hasattr(fa, 'get_communalities') and callable(getattr(fa, 'get_communalities')):
    comm_vals = fa.get_communalities()
elif hasattr(fa, 'communalities_'):
    comm_vals = fa.communalities_
else:
    comm_vals = np.sum(fa.loadings_ ** 2, axis=1)

communalities = pd.Series(comm_vals, index=columns, name="Communality_h2")
uniqueness = pd.Series(1.0 - np.array(comm_vals), index=columns, name="Uniqueness_psi")
diag_df = pd.concat([communalities, uniqueness], axis=1)
print("\\n[Variance Decomposition]:")
print(diag_df.round(4))

# 7. Factor Scores (Thurstone Regression Method)
try:
    factor_scores = fa.transform(df)
    scores_df = pd.DataFrame(
        factor_scores,
        columns=[f"FScore_{i+1}" for i in range(factor_scores.shape[1])]
    )
    print(f"\\n[Sample Factor Scores Preview (Head 5)]:\\n{scores_df.head().round(3)}")
except Exception as score_err:
    print(f"\\n[Factor Scores Note]: {score_err}")

# 8. Visualization: Scree Plot & 2D Factor Loadings Biplot (English Titles, Axes, Legends)
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5))

# Plot 1: Scree Plot & Kaiser Criterion
factors_x = range(1, len(ev) + 1)
ax1.plot(factors_x, ev, 'o-', color='#4f46e5', linewidth=2, markersize=6, label='Eigenvalues')
ax1.axhline(y=1.0, color='#f59e0b', linestyle='--', linewidth=1.8, label='Kaiser Criterion (λ = 1.0)')
ax1.set_title('Scree Plot: Eigenvalues by Factor Index', fontsize=12, fontweight='bold', pad=10)
ax1.set_xlabel('Factor Number', fontsize=10)
ax1.set_ylabel('Eigenvalue (λ)', fontsize=10)
ax1.set_xticks(list(factors_x))
ax1.legend(loc='upper right', frameon=True)
ax1.grid(True, linestyle=':', alpha=0.6)

# Plot 2: 2D Factor Loading Projection (Factor 1 vs Factor 2)
if loadings.shape[1] >= 2:
    f1 = loadings['Factor_1']
    f2 = loadings['Factor_2']
    ax2.scatter(f1, f2, color='#0284c7', s=50, edgecolors='#0f172a', linewidth=0.8, label='Variables')
    for i, col in enumerate(columns):
        # Use .iloc[i] for pandas 2.0+ compatibility
        clean_tag = col.split(' ')[0] if ' ' in col else col[:6]
        ax2.annotate(clean_tag, (f1.iloc[i], f2.iloc[i]), textcoords="offset points", xytext=(5, 5), fontsize=8)
    # Reference unit circle and axes
    circle = plt.Circle((0, 0), 1.0, color='#94a3b8', fill=False, linestyle='--', linewidth=1)
    ax2.add_patch(circle)
    ax2.axhline(0, color='#64748b', linewidth=0.8)
    ax2.axvline(0, color='#64748b', linewidth=0.8)
    ax2.set_xlim(-1.15, 1.15)
    ax2.set_ylim(-1.15, 1.15)
    ax2.set_title('Factor Loading Space: Factor 1 vs Factor 2', fontsize=12, fontweight='bold', pad=10)
    ax2.set_xlabel('Factor 1 Loading', fontsize=10)
    ax2.set_ylabel('Factor 2 Loading', fontsize=10)
    ax2.legend(loc='upper right', frameon=True)
    ax2.grid(True, linestyle=':', alpha=0.5)

plt.tight_layout()
plt.show()
`;
}

export function generatePythonScratchCode(params: CodeGenParams): string {
  const { caseName, variableNames, numFactors } = params;

  return `"""
From-Scratch Factor Analysis Engine - Python (Pure NumPy Linear Algebra & Matplotlib)
Case: ${caseName}
Variables: ${variableNames.join(', ')}
All plot titles, legends, and axes are formatted in English.
"""
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Matplotlib internationalization settings
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'SimHei', 'Microsoft YaHei', 'sans-serif']
plt.rcParams['axes.unicode_minus'] = False

def varimax_rotation(loadings, gamma=1.0, max_iter=100, tol=1e-6):
    """Kaiser's Varimax Orthogonal Rotation Implementation"""
    p, k = loadings.shape
    R = np.eye(k)
    var = 0.0
    h = np.sqrt(np.sum(loadings ** 2, axis=1, keepdims=True))
    h = np.maximum(h, 1e-12) # Numerical stability
    d = loadings / h

    for _ in range(max_iter):
        d_rotated = np.dot(d, R)
        u, s, vh = np.linalg.svd(
            np.dot(
                d.T,
                d_rotated ** 3 - (gamma / p) * np.dot(d_rotated, np.diag(np.sum(d_rotated ** 2, axis=0)))
            )
        )
        R_new = np.dot(u, vh)
        var_new = np.sum(s)
        if abs(var_new - var) < tol:
            break
        var = var_new
        R = R_new

    rotated_loadings = np.dot(loadings, R)
    return rotated_loadings, R

# 1. Variables and Correlated Sample Observation Matrix Z
columns = ${JSON.stringify(variableNames, null, 2)}
P = len(columns)
N = max(120, P * 15)

np.random.seed(42)
k_latent = max(2, min(${numFactors}, max(1, P - 1)))
f_true = np.random.randn(N, k_latent)

# Synthetic loading pattern
weights = np.zeros((P, k_latent))
for i in range(P):
    f_idx = i % k_latent
    weights[i, f_idx] = 0.75 + (i % 3) * 0.05
    weights[i, (f_idx + 1) % k_latent] = 0.20

noise = np.random.randn(N, P) * 0.35
X_raw = np.dot(f_true, weights.T) + noise + 10.0

# Standardize: Z = (X - mean) / std
Z = (X_raw - np.mean(X_raw, axis=0)) / np.std(X_raw, axis=0, ddof=1)

# 2. Sample Correlation Matrix R
R = np.dot(Z.T, Z) / (N - 1)

# 3. Spectral Decomposition (Eigenvalues & Eigenvectors)
eigenvalues, eigenvectors = np.linalg.eigh(R)
idx = np.argsort(eigenvalues)[::-1]
eigenvalues = eigenvalues[idx]
eigenvectors = eigenvectors[:, idx]

print(f"Sorted Eigenvalues (λ):\\n{np.round(eigenvalues, 4)}")

# 4. Extract Principal Factor Loadings
m = min(${numFactors}, max(1, P - 1))
Lambda_raw = eigenvectors[:, :m] * np.sqrt(np.maximum(0, eigenvalues[:m]))

# 5. Apply Varimax Rotation
Lambda_rot, T = varimax_rotation(Lambda_raw)
loadings_df = pd.DataFrame(
    Lambda_rot,
    index=columns,
    columns=[f"Factor_{i+1}" for i in range(m)]
)
print("\\nRotated Factor Loadings Matrix:")
print(loadings_df.round(4))

# 6. Compute Regression Factor Score Weights: W = inv(R) * Lambda_rot
inv_R = np.linalg.pinv(R)
W_regression = np.dot(inv_R, Lambda_rot)

# 7. Compute Factor Scores: F = Z * W
F_scores = np.dot(Z, W_regression)
print(f"\\nFactor Scores (Head 3):\\n{np.round(F_scores[:3], 3)}")

# 8. Visualization: Scree Plot (English Titles, Axes, Legends)
plt.figure(figsize=(7, 4.5))
plt.plot(range(1, P + 1), eigenvalues, 'o-', color='#4f46e5', linewidth=2, label='Eigenvalues')
plt.axhline(y=1.0, color='#f59e0b', linestyle='--', linewidth=1.5, label='Kaiser Criterion (λ = 1.0)')
plt.title('Scree Plot: Eigendecomposition', fontsize=12, fontweight='bold')
plt.xlabel('Factor Number', fontsize=10)
plt.ylabel('Eigenvalue (λ)', fontsize=10)
plt.xticks(range(1, P + 1))
plt.legend(loc='upper right')
plt.grid(True, linestyle=':', alpha=0.6)
plt.tight_layout()
plt.show()
`;
}

export function generateRLibraryCode(params: CodeGenParams): string {
  const { caseName, variableNames, numFactors, method, rotation } = params;
  const rMethod = method === 'PAF' ? 'pa' : method === 'ML' ? 'ml' : 'minres';
  const rRotation = rotation === 'none' ? 'none' : rotation;

  return `#' ===================================================================
#' Factor Analysis Production Pipeline - R (psych & GPArotation)
#' Case: ${caseName}
#' All plot titles, legends, and axes are formatted in English.
#' ===================================================================

if (!requireNamespace("psych", quietly = TRUE)) install.packages("psych")
if (!requireNamespace("GPArotation", quietly = TRUE)) install.packages("GPArotation")

library(psych)
library(GPArotation)

# 1. Load variables dataset
col_names <- c(${variableNames.map(v => `"${v}"`).join(', ')})
p <- length(col_names)
n <- max(150, p * 15)

set.seed(42)
# Generating correlated observations
k_latent <- max(2, min(${numFactors}, p - 1))
f_true <- matrix(rnorm(n * k_latent), nrow = n, ncol = k_latent)
weights <- matrix(0.2, nrow = p, ncol = k_latent)
for (i in 1:p) {
  f_idx <- ((i - 1) %% k_latent) + 1
  weights[i, f_idx] <- 0.75
}
df <- as.data.frame(f_true %*% t(weights) + matrix(rnorm(n * p, sd = 0.35), nrow = n))
colnames(df) <- col_names

# 2. Data Suitability Tests (KMO & Bartlett's Sphericity)
cat("\\n--- Data Suitability Diagnostics ---\\n")
cortest.bartlett(cor(df), n = nrow(df))
kmo_res <- KMO(cor(df))
print(kmo_res)

# 3. Factor Extraction and Rotation
# Method: ${method} ("${rMethod}"), Rotation: ${rotation} ("${rRotation}")
safe_nfactors <- min(${numFactors}, p - 1)
fa_model <- fa(
  r = df,
  nfactors = safe_nfactors,
  fm = "${rMethod}",
  rotate = "${rRotation}",
  scores = "regression"
)

# 4. Model Parameter Report
print(fa_model, digits = 3, cutoff = 0.3)

# 5. Extract Rotated Loadings & Factor Scores
cat("\\n--- Rotated Factor Loadings Matrix ---\\n")
print(round(fa_model$loadings, 3))

cat("\\n--- Variance Decomposition (h2 & u2) ---\\n")
print(round(data.frame(h2 = fa_model$communality, u2 = fa_model$uniquenesses), 3))

# 6. Visualization: Scree Plot & Factor Biplot (English Titles, Axes, Legends)
par(mfrow = c(1, 2))

# Plot 1: Scree Plot
ev <- fa_model$e.values
plot(ev, type = "b", pch = 19, col = "#4f46e5", lwd = 2,
     main = "Scree Plot: Eigenvalues & Variance",
     xlab = "Factor Number", ylab = "Eigenvalue (λ)")
abline(h = 1.0, col = "#f59e0b", lty = 2, lwd = 2)
legend("topright", legend = c("Eigenvalues", "Kaiser Criterion (λ = 1.0)"),
       col = c("#4f46e5", "#f59e0b"), lty = c(1, 2), pch = c(19, NA), bty = "n")
grid()

# Plot 2: Factor Loadings Biplot (F1 vs F2)
if (ncol(fa_model$loadings) >= 2) {
  load_mat <- unclass(fa_model$loadings)
  plot(load_mat[, 1], load_mat[, 2], pch = 19, col = "#0284c7",
       xlim = c(-1.1, 1.1), ylim = c(-1.1, 1.1),
       main = "Factor Loading Space: Factor 1 vs Factor 2",
       xlab = "Factor 1 Loading", ylab = "Factor 2 Loading")
  text(load_mat[, 1], load_mat[, 2], labels = rownames(load_mat), pos = 3, cex = 0.8)
  abline(h = 0, v = 0, col = "#64748b", lty = 3)
  legend("topright", legend = c("Variables"), col = c("#0284c7"), pch = 19, bty = "n")
  grid()
}
`;
}

export function generateRScratchCode(params: CodeGenParams): string {
  const { caseName, variableNames, numFactors } = params;

  return `#' ===================================================================
#' From-Scratch Factor Analysis Engine - R Base Linear Algebra
#' Case: ${caseName}
#' Variables: ${variableNames.join(', ')}
#' All plot titles, legends, and axes are formatted in English.
#' ===================================================================

# 1. Variables and Standardized Data Matrix Z
col_names <- c(${variableNames.map(v => `"${v}"`).join(', ')})
p <- length(col_names)
n <- max(120, p * 15)

set.seed(42)
k_latent <- max(2, min(${numFactors}, p - 1))
f_true <- matrix(rnorm(n * k_latent), nrow = n, ncol = k_latent)
weights <- matrix(0.2, nrow = p, ncol = k_latent)
for (i in 1:p) {
  f_idx <- ((i - 1) %% k_latent) + 1
  weights[i, f_idx] <- 0.75
}
X <- f_true %*% t(weights) + matrix(rnorm(n * p, sd = 0.35), nrow = n) + 10
Z <- scale(X)

# 2. Sample Correlation Matrix R
R <- (t(Z) %*% Z) / (n - 1)

# 3. Spectral Decomposition
decomp <- eigen(R)
lambda_vals <- decomp$values
V_vecs <- decomp$vectors

cat("Sorted Eigenvalues (λ):\\n", round(lambda_vals, 4), "\\n")

# 4. Unrotated Loadings
m <- min(${numFactors}, p - 1)
Lambda_raw <- V_vecs[, 1:m] %*% diag(sqrt(pmax(0, lambda_vals[1:m])))
rownames(Lambda_raw) <- col_names
colnames(Lambda_raw) <- paste0("Factor_", 1:m)

# 5. Kaiser Varimax Rotation
varimax_out <- varimax(Lambda_raw)
Lambda_rot <- varimax_out$loadings

cat("\\nRotated Factor Loadings Matrix:\\n")
print(round(Lambda_rot, 4))

# 6. Factor Scores
inv_R <- solve(R)
W_weights <- inv_R %*% Lambda_rot
F_scores <- Z %*% W_weights
cat("\\nSample Factor Scores (Head 5):\\n")
print(head(round(F_scores, 3)))

# 7. Visualization: Scree Plot (English Titles, Axes, Legends)
plot(lambda_vals, type = "b", pch = 19, col = "#4f46e5", lwd = 2,
     main = "Scree Plot: Eigendecomposition",
     xlab = "Factor Number", ylab = "Eigenvalue (λ)")
abline(h = 1.0, col = "#f59e0b", lty = 2, lwd = 2)
legend("topright", legend = c("Eigenvalues", "Kaiser Criterion (λ = 1.0)"),
       col = c("#4f46e5", "#f59e0b"), lty = c(1, 2), pch = c(19, NA), bty = "n")
grid()
`;
}
