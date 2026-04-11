precision mediump float;

uniform sampler2D tex0;
uniform vec2 texelSize;
uniform float uTime;

varying vec2 vTexCoord;

// --------------------
// Réglages artistiques
// --------------------
float maskMin = 0.10;
float maskMax = 0.30;
float normalStrength = 3.8;
float specPower = 20.0;
float specAmount = 0.95;
float fresnelPower = 2.5;
float fresnelAmount = 0.35;
float chromaAmount = 0.03;
float diffuseAmount = 0.12;
float highlightCompression = 0.35;

float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

void main() {
  vec2 uv = vTexCoord;
  uv.y = 1.0 - uv.y;
  vec3 base = texture2D(tex0, uv).rgb;

  float distFromWhite = distance(base, vec3(1.0));
  float paintMask = smoothstep(0.01, 0.15, distFromWhite);


  // Échantillonnage pour le relief
  float l1 = luma(texture2D(tex0, uv - vec2(texelSize.x * 4.0, 0.0)).rgb);
  float r1 = luma(texture2D(tex0, uv + vec2(texelSize.x * 4.0, 0.0)).rgb);
  float u1 = luma(texture2D(tex0, uv - vec2(0.0, texelSize.y * 4.0)).rgb);
  float d1 = luma(texture2D(tex0, uv + vec2(0.0, texelSize.y * 4.0)).rgb);

  float l2 = luma(texture2D(tex0, uv - vec2(texelSize.x * 8.0, 0.0)).rgb);
  float r2 = luma(texture2D(tex0, uv + vec2(texelSize.x * 8.0, 0.0)).rgb);
  float u2 = luma(texture2D(tex0, uv - vec2(0.0, texelSize.y * 8.0)).rgb);
  float d2 = luma(texture2D(tex0, uv + vec2(0.0, texelSize.y * 8.0)).rgb);

  float dx = ((l1 - r1) * 0.7 + (l2 - r2) * 0.3);
  float dy = ((u1 - d1) * 0.7 + (u2 - d2) * 0.3);

  vec3 normal = normalize(vec3(dx * normalStrength, dy * normalStrength, 1.0));

  // Lumière et reflets
  vec3 lightDir = normalize(vec3(0.65 + 0.25 * sin(uTime * 0.7), -0.45 + 0.20 * cos(uTime * 0.45), 1.0));
  //vec3 lightDir = normalize(vec3(0.65, -0.45, 1.0));
  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  vec3 reflectDir = reflect(-lightDir, normal);

  float diffuse = max(dot(normal, lightDir), 0.0);
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), specPower);
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), fresnelPower);

  // Aberration chromatique légère
  vec3 shifted = vec3(
    texture2D(tex0, uv + vec2(texelSize.x * 1.5, 0.0)).r,
    texture2D(tex0, uv).g,
    texture2D(tex0, uv - vec2(texelSize.x * 1.5, 0.0)).b
  );

  vec3 col = mix(base, shifted, chromaAmount * paintMask);
  col *= 1.0 + diffuse * diffuseAmount * paintMask;
  col += vec3(1.0, 1.0, 1.06) * spec * specAmount * paintMask;
  col += vec3(0.18, 0.20, 0.24) * fresnel * fresnelAmount * paintMask;

  // Ne pas tonemapper le fond blanc : on applique l'effet seulement sur la peinture.
  vec3 shaded = col / (1.0 + col * highlightCompression);
  vec3 finalColor = mix(base, shaded, paintMask);

  gl_FragColor = vec4(finalColor, 1.0);

}
