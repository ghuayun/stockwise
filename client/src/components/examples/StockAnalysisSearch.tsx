import { StockAnalysisSearch } from "../StockAnalysisSearch";

export default function StockAnalysisSearchExample() {
  return (
    <div className="p-6 bg-background">
      <div className="max-w-2xl">
        <StockAnalysisSearch
          onAnalyze={(ticker) => console.log(`Analyzing ${ticker}`)}
        />
      </div>
    </div>
  );
}
