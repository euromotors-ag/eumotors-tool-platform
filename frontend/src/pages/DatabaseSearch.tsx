import PageContainer from "@/components/PageContainer";

function DatabaseSearch() {
  return (
    <div className="bg-background text-foreground min-h-screen py-8">
      <PageContainer>
        <h1 className="text-3xl font-bold mb-6">Database Search</h1>
        <p className="text-muted-foreground mb-8">
          Search and review database entries.
        </p>
        <div className="rounded-xl bg-card p-6 border border-border">
          <p className="text-sm text-muted-foreground">
            This page is ready for search filters and results.
          </p>
        </div>
      </PageContainer>
    </div>
  );
}

export default DatabaseSearch;
