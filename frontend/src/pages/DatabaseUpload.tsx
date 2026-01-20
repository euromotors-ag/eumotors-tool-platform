import PageContainer from "@/components/PageContainer";

function DatabaseUpload() {
  return (
    <div className="bg-background text-foreground min-h-screen py-8">
      <PageContainer>
        <h1 className="text-3xl font-bold mb-6">Database Upload</h1>
        <p className="text-muted-foreground mb-8">
          Upload data to the database.
        </p>
        <div className="rounded-xl bg-card p-6 border border-border">
          <p className="text-sm text-muted-foreground">
            This page is ready for the upload workflow.
          </p>
        </div>
      </PageContainer>
    </div>
  );
}

export default DatabaseUpload;
