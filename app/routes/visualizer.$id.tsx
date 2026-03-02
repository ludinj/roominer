import Button from "components/ui/Button";
import { generate3DView } from "lib/ai.actions";
import { createProject, getProjectById } from "lib/puter.actions";
import { Box, Download, RefreshCcw, Share2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";
import { useNavigate, useOutletContext, useParams } from "react-router";
import { toast } from "sonner";

const VisualizerId = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { userId } = useOutletContext<AuthContext>();

  const [isProcessing, setIsProcessing] = useState(false);
  const [project, setProject] = useState<DesignItem | null>(null);
  const [isProjectLoading, setIsProjectLoading] = useState<boolean>(true);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const hasInitialGenerated = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const loadProject = async () => {
      if (!id) {
        setIsProjectLoading(false);
        return;
      }

      setIsProjectLoading(true);

      const fetchedProject = await getProjectById({ id });

      if (!isMounted) return;

      setProject(fetchedProject);
      setCurrentImage(fetchedProject?.renderedImage || null);
      setIsProjectLoading(false);
      hasInitialGenerated.current = false;
    };

    loadProject();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (
      isProjectLoading ||
      hasInitialGenerated.current ||
      !project?.sourceImage
    )
      return;

    if (project.renderedImage) {
      setCurrentImage(project.renderedImage);
      hasInitialGenerated.current = true;
      return;
    }

    hasInitialGenerated.current = true;
    void runGeneration(project);
  }, [project, isProjectLoading]);
  const runGeneration = async (item: DesignItem) => {
    if (!id || !item.sourceImage) return;
    try {
      setIsProcessing(true);
      const result = await generate3DView({ sourceImage: item.sourceImage });

      if (result.renderedImage) {
        setCurrentImage(result.renderedImage);
        // update the project with the rendered image
        const updatedItem = {
          ...item,
          renderedImage: result.renderedImage,
          renderedPath: result.renderedPath,
          timeStamp: Date.now(),
          ownerId: item.ownerId ?? userId ?? null,
          isPublic: item.isPublic ?? false,
        };
        const saved = await createProject({
          item: updatedItem,
          visibility: "private",
        });
        if (saved) {
          setProject(saved);
          setCurrentImage(saved.renderedImage || result.renderedImage);
        }
      }
    } catch (error) {
      console.log("Generation failed: ", error);
    } finally {
      setIsProcessing(false);
    }
  };
  const handleBack = () => navigate("/");
  const handleExport = async () => {
    if (!currentImage) return;

    try {
      const response = await fetch(currentImage);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `roominer-${id || "design"}.png`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download image", error);
    }
  };
  const handleShare = async () => {
    if (!currentImage) {
      toast.error("Nothing to share yet");
      return;
    }

    try {
      // Prefer native share (mobile + modern browsers)
      if (navigator.share) {
        await navigator.share({
          title: project?.name || "Roominer Design",
          text: "Check out my 3D room design ✨",
          url: currentImage,
        });

        toast.success("Shared successfully");
        return;
      }

      // Fallback: copy link to clipboard
      await navigator.clipboard.writeText(currentImage);
      toast.success("Share link copied to clipboard");
    } catch (error) {
      console.error("Share failed:", error);
      toast.error("Failed to share");
    }
  };
  return (
    <div className="visualizer">
      <nav className="topbar">
        <div className="brand">
          <Box className="logo" />
          <span className="name">Roominer</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleBack} className="exit">
          <X className="icon" />
          Exit Editor
        </Button>
      </nav>
      <section className="content">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-meta">
              <p>Project</p>
              <h2>{project?.name || `Residence ${id}`}</h2>
              <p className="note">Created by You</p>
            </div>
            <div className="panel-actions">
              <Button
                size="sm"
                onClick={handleExport}
                className="export"
                disabled={!currentImage}
              >
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
              <Button size="sm" onClick={handleShare} className="share">
                <Share2 className="w-4 h-4 mr-2" /> Share
              </Button>
            </div>
          </div>
          <div className={`render-area ${isProcessing ? "is-processing" : ""}`}>
            {currentImage ? (
              <img src={currentImage} alt="Ai Render" className="render-img" />
            ) : (
              <div className="render-placeholder">
                {project?.sourceImage && (
                  <img
                    src={project?.sourceImage}
                    alt="original"
                    className="render-fallback"
                  />
                )}
              </div>
            )}
            {isProcessing && (
              <div className="render-overlay">
                <div className="rendering-card">
                  <RefreshCcw className="spinner" />
                  <span className="title">Rendering...</span>
                  <span className="subtitle">
                    Generating your 3D visualization.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="panel compare">
          <div className="panel-header">
            <div className="panel-meta">
              <p>Comparison</p>
              <h3>Before and After</h3>
            </div>
            <div className="hint">Drag to compare</div>
          </div>
          <div className="compare-stage">
            {project?.sourceImage && currentImage ? (
              <ReactCompareSlider
                defaultValue={50}
                style={{ width: "100%", height: "auto" }}
                itemOne={
                  <ReactCompareSliderImage
                    src={project.sourceImage}
                    alt="before"
                    className="compare-img"
                  />
                }
                itemTwo={
                  <ReactCompareSliderImage
                    src={currentImage || project?.renderedImage || ""}
                    alt="after"
                    className="compare-img"
                  />
                }
              />
            ) : (
              <div className="compare-fallback">
                {project?.sourceImage && (
                  <img
                    src={project.sourceImage}
                    alt="src-image"
                    className="compare-img"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default VisualizerId;
