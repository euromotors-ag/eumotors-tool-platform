import { useState, useCallback, useMemo, useEffect } from "react";
import {
  ProcessingJob,
  ProcessingQueue,
  QueueSummary,
  ProfileStatus,
} from "../../types/processing";
import { useToastContext } from "../../../../hooks/useToast";
import { useDebugLog } from "../../../../contexts/DebugLogContext";

export const useProcessingQueue = () => {
  const [queue, setQueue] = useState<ProcessingQueue>({
    jobs: [],
    isProcessing: false,
  });

  const { success, warning } = useToastContext();
  const { addLog } = useDebugLog();

  // Automatiskt rensa kö:n när alla jobb är completed
  useEffect(() => {
    if (queue.jobs.length > 0 && !queue.isProcessing) {
      const allCompleted = queue.jobs.every(
        (job: ProcessingJob) => job.status === "completed"
      );

      if (allCompleted) {
        setTimeout(() => {
          setQueue({ jobs: [], isProcessing: false });
        }, 1000);
      }
    }
  }, [queue.jobs, queue.isProcessing]);

  const addToQueue = useCallback(
    (files: File[], profile: string, visualOrder: number[]) => {
      // Validera att samma bilder inte redan finns för samma profil
      const existingJob = queue.jobs.find(
        (job) => job.profile === profile && job.status !== "completed"
      );

      if (existingJob) {
        // Kontrollera om någon av de nya filerna redan finns i det befintliga jobbet
        const duplicateFiles = files.filter((newFile) =>
          existingJob.files.some(
            (existingFile) =>
              existingFile.name === newFile.name &&
              existingFile.size === newFile.size &&
              existingFile.lastModified === newFile.lastModified
          )
        );

        if (duplicateFiles.length > 0) {
          // If all files are duplicates, show warning and stop
          if (duplicateFiles.length === files.length) {
            warning(`Image already in queue`, { duration: 3000 });
            return;
          } else {
            // If only some files are duplicates, filter them out and add the new ones
            const newFiles = files.filter(
              (newFile) =>
                !existingJob.files.some(
                  (existingFile) =>
                    existingFile.name === newFile.name &&
                    existingFile.size === newFile.size &&
                    existingFile.lastModified === newFile.lastModified
                )
            );

            if (newFiles.length === 0) {
              warning(
                `Cannot add ${duplicateFiles.length} images - they already exist in queue for ${profile}`,
                { duration: 4000 }
              );
              return;
            }

            const newVisualOrder = visualOrder.filter((_, index) => {
              const file = files[index];
              return newFiles.includes(file);
            });

            setQueue((prev) => ({
              ...prev,
              jobs: prev.jobs.map((job) =>
                job.id === existingJob.id
                  ? {
                      ...job,
                      files: [...job.files, ...newFiles],
                      visualOrder: [...job.visualOrder, ...newVisualOrder],
                    }
                  : job
              ),
            }));

            warning(
              `${duplicateFiles.length} duplicates ignored. ${newFiles.length} new images added`,
              { duration: 4000 }
            );
            return;
          }
        } else {
          setQueue((prev) => ({
            ...prev,
            jobs: prev.jobs.map((job) =>
              job.id === existingJob.id
                ? {
                    ...job,
                    files: [...job.files, ...files],
                    visualOrder: [...job.visualOrder, ...visualOrder],
                  }
                : job
            ),
          }));

          success(`${files.length} new images added to queue for ${profile}`);
          return;
        }
      }

      const newJob: ProcessingJob = {
        id: `${profile}-${Date.now()}`,
        files, // Spara faktiska File-objekt
        visualOrder, // Spara visuell ordning för filnamn
        profile,
        status: "pending",
        createdAt: new Date(),
      };

      setQueue((prev) => {
        const activeJobs = prev.jobs.filter(
          (job: ProcessingJob) => job.status !== "completed"
        );
        return {
          ...prev,
          jobs: [...activeJobs, newJob],
        };
      });
      success(`${files.length} new images added to queue for ${profile}`);
      addLog(
        "success",
        `Added ${files.length} images to queue for ${profile}`,
        {
          profile,
          fileCount: files.length,
          fileNames: files.map((f) => f.name),
        }
      );
    },
    [queue.jobs, success, warning, addLog]
  );

  const removeFromQueue = useCallback((jobId: string) => {
    setQueue((prev) => ({
      ...prev,
      jobs: prev.jobs.filter((job: ProcessingJob) => job.id !== jobId),
    }));
  }, []);

  const removeProfileFromQueue = useCallback(
    (profile: string) => {
      setQueue((prev) => ({
        ...prev,
        jobs: prev.jobs.filter((job: ProcessingJob) => job.profile !== profile),
      }));
      success("Job removed from queue");
    },
    [success]
  );

  const startProcessing = useCallback(
    async (
      onImageProcessed: (imageUrl: string, visualIndex: number) => void
    ) => {
      if (queue.jobs.length === 0) {
        addLog("warning", "No jobs in queue to process");
        return;
      }

      addLog("info", `Starting processing of ${queue.jobs.length} job(s)`, {
        totalJobs: queue.jobs.length,
        jobs: queue.jobs.map((job) => ({
          id: job.id,
          profile: job.profile,
          fileCount: job.files.length,
          status: job.status,
        })),
      });

      setQueue((prev) => ({ ...prev, isProcessing: true }));

      try {
        // Group jobs by profile to handle them in parallel
        const jobsByProfile = queue.jobs.reduce(
          (acc: { [key: string]: ProcessingJob[] }, job: ProcessingJob) => {
            if (!acc[job.profile]) {
              acc[job.profile] = [];
            }
            acc[job.profile].push(job);
            return acc;
          },
          {} as { [key: string]: ProcessingJob[] }
        );

        // Process each profile separately
        for (const [profile, jobs] of Object.entries(jobsByProfile)) {
          addLog("info", `Processing profile: ${profile}`, {
            profile,
            jobCount: jobs.length,
            totalImages: jobs.reduce((sum, job) => sum + job.files.length, 0),
          });

          // Update all jobs for this profile to processing
          setQueue((prev) => ({
            ...prev,
            jobs: prev.jobs.map((j: ProcessingJob) =>
              j.profile === profile ? { ...j, status: "processing" } : j
            ),
          }));

          // Process each job in the profile
          for (const job of jobs) {
            addLog("info", `Processing job ${job.id}`, {
              jobId: job.id,
              profile: job.profile,
              imageCount: job.files.length,
              imageNames: job.files.map((f) => f.name),
            });
            try {
              // Process each image for this job
              for (let i = 0; i < job.files.length; i++) {
                const file = job.files[i];
                const visualIndex = job.visualOrder[i]; // Use visual index for filename

                if (file) {
                  addLog(
                    "api",
                    `Calling CarCutter API for image: ${file.name}`,
                    {
                      fileName: file.name,
                      fileSize: file.size,
                      profile: job.profile,
                      visualIndex,
                    }
                  );

                  // Create FormData for API call
                  const formData = new FormData();
                  formData.append("image", file);
                  formData.append("profile_key", job.profile);

                  const startTime = Date.now();

                  try {
                    // Call the real API!
                    const { imageApi } = await import(
                      "../../../../api/image.api"
                    );

                    const result = await imageApi.processImage(formData);
                    const processingTime = Date.now() - startTime;
                    const imageUrl = URL.createObjectURL(result);

                    addLog("success", `Successfully processed: ${file.name}`, {
                      fileName: file.name,
                      profile: job.profile,
                      processingTime: `${processingTime}ms`,
                      resultSize: result.size,
                      visualIndex,
                    });

                    onImageProcessed(imageUrl, visualIndex);
                  } catch (apiError) {
                    const processingTime = Date.now() - startTime;
                    addLog("error", `Failed to process: ${file.name}`, {
                      fileName: file.name,
                      profile: job.profile,
                      processingTime: `${processingTime}ms`,
                      error:
                        apiError instanceof Error
                          ? apiError.message
                          : String(apiError),
                      errorDetails: apiError,
                    });
                    throw apiError; // Re-throw to be caught by outer try-catch
                  }
                }
              }

              // Update job status to completed
              setQueue((prev) => ({
                ...prev,
                jobs: prev.jobs.map((j: ProcessingJob) =>
                  j.id === job.id ? { ...j, status: "completed" } : j
                ),
              }));

              addLog("success", `Completed job: ${job.id}`, {
                jobId: job.id,
                profile: job.profile,
                processedImages: job.files.length,
              });
            } catch (error) {
              addLog("error", `Failed job: ${job.id}`, {
                jobId: job.id,
                profile: job.profile,
                error: error instanceof Error ? error.message : String(error),
                errorDetails: error,
              });

              setQueue((prev) => ({
                ...prev,
                jobs: prev.jobs.map((j: ProcessingJob) =>
                  j.id === job.id ? { ...j, status: "failed" } : j
                ),
              }));
            }
          }
        }
      } catch (error) {
        addLog("error", "Critical error in processing pipeline", {
          error: error instanceof Error ? error.message : String(error),
          errorDetails: error,
        });
      } finally {
        setQueue((prev) => ({ ...prev, isProcessing: false }));
        addLog("info", "Processing pipeline completed");
      }
    },
    [queue.jobs, addLog]
  );

  const clearQueue = useCallback(() => {
    setQueue({ jobs: [], isProcessing: false });
    success("Queue cleared");
  }, [success]);

  const queueSummary = useMemo((): QueueSummary[] => {
    const summary: { [key: string]: number } = {};

    queue.jobs.forEach((job: ProcessingJob) => {
      if (job.status === "pending") {
        summary[job.profile] = (summary[job.profile] || 0) + job.files.length;
      }
    });

    return Object.entries(summary).map(([profile, count]) => ({
      profile,
      count,
    }));
  }, [queue.jobs]);

  const profileStatuses = useMemo((): ProfileStatus[] => {
    const statuses: { [key: string]: ProfileStatus } = {};

    // Filter out completed jobs so they are not shown in UI
    const activeJobs = queue.jobs.filter(
      (job: ProcessingJob) => job.status !== "completed"
    );

    // If there are no active jobs or all jobs are completed, return an empty array
    if (activeJobs.length === 0) {
      return [];
    }

    activeJobs.forEach((job: ProcessingJob) => {
      if (!statuses[job.profile]) {
        statuses[job.profile] = {
          profile: job.profile,
          count: 0,
          status: "ready",
        };
      }

      statuses[job.profile].count += job.files.length;

      if (job.status === "processing") {
        statuses[job.profile].status = "processing";
      } else if (job.status === "pending") {
        statuses[job.profile].status = "ready";
      } else if (job.status === "failed") {
        statuses[job.profile].status = "failed";
      }
    });

    return Object.values(statuses);
  }, [queue.jobs]);

  const totalPendingImages = useMemo(() => {
    return queue.jobs
      .filter((job: ProcessingJob) => job.status === "pending")
      .reduce((total, job) => total + job.files.length, 0);
  }, [queue.jobs]);

  // Function to get files and visual order for a profile
  const getJobDataForProfile = useCallback(
    (profile: string): { files: File[]; visualOrder: number[] } | null => {
      const job = queue.jobs.find((job) => job.profile === profile);
      return job ? { files: job.files, visualOrder: job.visualOrder } : null;
    },
    [queue.jobs]
  );

  // Function to update visual order for all jobs live
  const updateVisualOrderForAllJobs = useCallback(
    (newVisualOrder: number[], selectedFiles: File[]) => {
      setQueue((prev) => {
        // Check if any update is actually needed
        const needsUpdate = prev.jobs.some((job) => {
          // If any job has a different visualOrder than the new one, we need to update
          return !job.visualOrder.every((oldIndex, i) => {
            const file = job.files[i];
            const fileIndexInSelectedFiles = selectedFiles.findIndex(
              (selectedFile) => selectedFile === file
            );
            const newVisualIndex = newVisualOrder.indexOf(
              fileIndexInSelectedFiles
            );
            return newVisualIndex === oldIndex;
          });
        });

        if (!needsUpdate) {
          return prev;
        }

        return {
          ...prev,
          jobs: prev.jobs.map((job) => {
            // Update visualOrder for each job based on new visual indices
            const updatedVisualOrder = job.files.map((jobFile) => {
              // Find the new position of this file in selectedFiles
              const fileIndexInSelectedFiles = selectedFiles.findIndex(
                (selectedFile) => selectedFile === jobFile
              );

              if (fileIndexInSelectedFiles !== -1) {
                const newVisualIndex = newVisualOrder.indexOf(
                  fileIndexInSelectedFiles
                );

                return newVisualIndex !== -1 ? newVisualIndex : 0;
              }

              return 0;
            });

            return {
              ...job,
              visualOrder: updatedVisualOrder,
            };
          }),
        };
      });
    },
    []
  );

  // Function to find images that are in process
  const findImagesInProcess = useCallback(
    (filesToCheck: File[]) => {
      const imagesInProcess: Array<{
        fileName: string;
        profile: string;
        visualIndex: number;
      }> = [];

      queue.jobs.forEach((job) => {
        if (job.status !== "completed") {
          job.files.forEach((jobFile, fileIndex) => {
            // Check if this file exists in filesToCheck (images to be deleted)
            const isFileToBeDeleted = filesToCheck.some(
              (fileToDelete) => fileToDelete === jobFile
            );

            if (isFileToBeDeleted) {
              const visualIndex = job.visualOrder[fileIndex];
              imagesInProcess.push({
                fileName: jobFile.name,
                profile: job.profile,
                visualIndex: visualIndex,
              });
            }
          });
        }
      });

      return imagesInProcess;
    },
    [queue.jobs]
  );

  const result = {
    queue,
    addToQueue,
    removeFromQueue,
    removeProfileFromQueue,
    startProcessing,
    clearQueue,
    queueSummary,
    profileStatuses,
    totalPendingImages,
    isProcessing: queue.isProcessing,
    getJobDataForProfile,
    updateVisualOrderForAllJobs,
    findImagesInProcess,
  };

  return result;
};
