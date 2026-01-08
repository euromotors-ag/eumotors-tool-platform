import PageContainer from "@/components/PageContainer";
import PdfConverter from "@/components/converter/PdfConverter";

function Converter() {
  return (
    <div className="bg-background text-foreground min-h-screen py-8">
      <PageContainer>
        <h1 className="text-3xl font-bold mb-6">PDF Convert</h1>
        <p className="text-muted-foreground mb-8">
          Extract text from PDF files and convert to JSON format
        </p>

        <div className="mb-6 flex border-b border-border">
          <p className="px-4 py-2 font-medium focus:outline-none text-blue-500 border-b-2 border-blue-500">
            PDF Convert
          </p>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-card p-8 shadow-lg border border-border">
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl"></div>

          <div className="relative z-10">
            <PdfConverter />
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

export default Converter;
