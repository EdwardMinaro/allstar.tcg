param(
  [string]$CardRenderDir = "..\assets\card_renders",
  [byte]$WhiteThreshold = 245
)

$ErrorActionPreference = "Stop"

$resolvedDir = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot $CardRenderDir)

$code = @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public static class AllstarCardEdgeFixer {
  private static Bitmap ToArgb(Bitmap source) {
    Bitmap bmp = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
    using (Graphics g = Graphics.FromImage(bmp)) {
      g.DrawImage(source, 0, 0, source.Width, source.Height);
    }
    return bmp;
  }

  private static Rectangle FindContentBounds(Bitmap bmp, byte threshold) {
    Rectangle rect = new Rectangle(0, 0, bmp.Width, bmp.Height);
    BitmapData data = bmp.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
    try {
      int bytes = Math.Abs(data.Stride) * bmp.Height;
      byte[] buffer = new byte[bytes];
      Marshal.Copy(data.Scan0, buffer, 0, bytes);
      int minX = bmp.Width, minY = bmp.Height, maxX = -1, maxY = -1;

      for (int y = 0; y < bmp.Height; y++) {
        int row = y * data.Stride;
        for (int x = 0; x < bmp.Width; x++) {
          int i = row + x * 4;
          byte b = buffer[i];
          byte g = buffer[i + 1];
          byte r = buffer[i + 2];
          byte a = buffer[i + 3];
          bool white = r > threshold && g > threshold && b > threshold;
          if (a > 10 && !white) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (maxX < minX || maxY < minY) return rect;
      return Rectangle.FromLTRB(minX, minY, maxX + 1, maxY + 1);
    } finally {
      bmp.UnlockBits(data);
    }
  }

  private static GraphicsPath RoundedRect(RectangleF rect, float radius) {
    float diameter = radius * 2f;
    GraphicsPath path = new GraphicsPath();
    path.AddArc(rect.Left, rect.Top, diameter, diameter, 180, 90);
    path.AddArc(rect.Right - diameter, rect.Top, diameter, diameter, 270, 90);
    path.AddArc(rect.Right - diameter, rect.Bottom - diameter, diameter, diameter, 0, 90);
    path.AddArc(rect.Left, rect.Bottom - diameter, diameter, diameter, 90, 90);
    path.CloseFigure();
    return path;
  }

  private static Bitmap Crop(Bitmap source, Rectangle bounds) {
    Bitmap cropped = new Bitmap(bounds.Width, bounds.Height, PixelFormat.Format32bppArgb);
    using (Graphics g = Graphics.FromImage(cropped)) {
      g.Clear(Color.FromArgb(0, 0, 0, 0));
      g.DrawImage(source, new Rectangle(0, 0, bounds.Width, bounds.Height), bounds, GraphicsUnit.Pixel);
    }
    return cropped;
  }

  private static Bitmap ApplyRoundedMask(Bitmap source) {
    Bitmap output = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
    float radius = Math.Max(18f, Math.Min(source.Width, source.Height) * 0.044f);
    RectangleF rect = new RectangleF(0.5f, 0.5f, source.Width - 1f, source.Height - 1f);

    using (Graphics g = Graphics.FromImage(output)) {
      g.Clear(Color.FromArgb(0, 0, 0, 0));
      g.SmoothingMode = SmoothingMode.AntiAlias;
      using (GraphicsPath path = RoundedRect(rect, radius)) {
        g.SetClip(path);
        g.DrawImage(source, 0, 0, source.Width, source.Height);
      }
    }

    return output;
  }

  private static void RemoveEdgeWhite(Bitmap bmp, byte threshold) {
    int width = bmp.Width;
    int height = bmp.Height;
    bool[,] seen = new bool[width, height];
    Queue<Point> queue = new Queue<Point>();

    Action<int,int> enqueue = (x, y) => {
      if (x < 0 || y < 0 || x >= width || y >= height || seen[x, y]) return;
      Color c = bmp.GetPixel(x, y);
      bool transparent = c.A <= 10;
      bool white = c.A > 10 && c.R > threshold && c.G > threshold && c.B > threshold;
      if (!transparent && !white) return;
      seen[x, y] = true;
      queue.Enqueue(new Point(x, y));
    };

    for (int x = 0; x < width; x++) {
      enqueue(x, 0);
      enqueue(x, height - 1);
    }
    for (int y = 0; y < height; y++) {
      enqueue(0, y);
      enqueue(width - 1, y);
    }

    int[] dx = new int[] { 1, -1, 0, 0 };
    int[] dy = new int[] { 0, 0, 1, -1 };
    while (queue.Count > 0) {
      Point p = queue.Dequeue();
      Color c = bmp.GetPixel(p.X, p.Y);
      bool transparent = c.A <= 10;
      bool white = c.A > 10 && c.R > threshold && c.G > threshold && c.B > threshold;
      if (transparent || white) {
        bmp.SetPixel(p.X, p.Y, Color.FromArgb(0, 0, 0, 0));
      }
      for (int i = 0; i < 4; i++) enqueue(p.X + dx[i], p.Y + dy[i]);
    }
  }

  public static string Fix(string path, byte threshold) {
    byte[] bytes = File.ReadAllBytes(path);
    using (MemoryStream stream = new MemoryStream(bytes))
    using (Bitmap original = new Bitmap(stream))
    using (Bitmap argb = ToArgb(original)) {
      Rectangle bounds = FindContentBounds(argb, threshold);
      bool cropped = bounds.X > 8 || bounds.Y > 8 || bounds.Right < argb.Width - 8 || bounds.Bottom < argb.Height - 8;

      using (Bitmap working = cropped ? Crop(argb, bounds) : (Bitmap)argb.Clone())
      using (Bitmap fixedImage = ApplyRoundedMask(working)) {
        RemoveEdgeWhite(fixedImage, threshold);
        string temp = path + ".tmp.png";
        fixedImage.Save(temp, ImageFormat.Png);
        File.Copy(temp, path, true);
        File.Delete(temp);
        return String.Format("{0}x{1} -> {2}x{3}{4}", argb.Width, argb.Height, fixedImage.Width, fixedImage.Height, cropped ? " cropped" : "");
      }
    }
  }
}
'@

Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing

$files = Get-ChildItem -LiteralPath $resolvedDir -File -Filter *.png |
  Where-Object { $_.Name -notlike "*.tmp.png" } |
  Sort-Object Name
$changed = foreach ($file in $files) {
  $result = [AllstarCardEdgeFixer]::Fix($file.FullName, $WhiteThreshold)
  [pscustomobject]@{ File = $file.Name; Result = $result }
}

$changed | Format-Table -AutoSize
Write-Host "Fixed $($files.Count) card render PNG files."
