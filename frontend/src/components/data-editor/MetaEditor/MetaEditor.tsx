import { CarListing } from "../../../libs/catalog/index.mjs";
import { State, useSubstate } from "../../../hooks/useSubstate";
import "./MetaEditor.css";

function truncateUrl(url: string, maxLength: number = 40): string {
  if (!url) return "";
  return url.length > maxLength ? url.substring(0, maxLength) + "..." : url;
}

export function MetaEditor({
  state,
}: {
  state: State<CarListing>;
}): React.ReactElement {
  const commentState = useSubstate(state, "comment");
  const comparisonLinkState = useSubstate(state, "comparison_link");
  const comparisonTextState = useSubstate(state, "comparison_text");
  const comparisonPriceState = useSubstate(state, "comparison_price");
  const comparisonPriceValueState = useSubstate(comparisonPriceState, "value");
  const priceB2bState = useSubstate(state, "price_b2b");
  const priceB2bValueState = useSubstate(priceB2bState, "value");
  const priceB2cState = useSubstate(state, "price_b2c");
  const priceB2cValueState = useSubstate(priceB2cState, "value");
  const uniqueState = useSubstate(state, "unique");
  const trimState = useSubstate(state, "trim");
  const dealerPhoneState = useSubstate(state, "dealer_phone");
  const dealerEmailState = useSubstate(state, "dealer_email");

  const original_link = commentState[0]?.split("\n Original Link: ")[1];
  const original_title = commentState[0]
    ?.split("\n Original Link: ")[0]
    ?.split("Original Title: ")[1];

  return (
    <div className="meta-editor max-h-[400px] overflow-y-auto rounded">
      <table className="w-full border-collapse">
        <tbody>
          {original_title && (
            <tr className="border-b border-gray-700/30  bg-gradient-to-r from-blue-500/5 to-purple-500/5">
              <td className="py-3 pr-8 pl-2 text-sm font-medium text-gray-300 whitespace-nowrap">
                Original Title:
              </td>
              <td className="py-2 px-2 text-gray-200">{original_title}</td>
            </tr>
          )}
          {original_link && (
            <tr className="border-b border-gray-700/30 ">
              <td className="py-3 pr-8 pl-2 text-sm font-medium text-gray-300 whitespace-nowrap">
                Target Link:
              </td>
              <td className="py-2 px-2">
                <a
                  href={original_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400">
                  {truncateUrl(original_link)}
                </a>
              </td>
            </tr>
          )}
          <tr className="border-b border-gray-700/30">
            <td className="py-3 pr-8 pl-2 text-sm font-medium text-gray-300 whitespace-nowrap">
              Comparison Link:
            </td>
            <td className="py-2 px-2">
              <a
                href={comparisonLinkState[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400">
                {truncateUrl(comparisonLinkState[0])}
              </a>
            </td>
          </tr>
          <tr className="border-b border-gray-700/30">
            <td className="py-3 pr-8 pl-2 text-sm font-medium text-gray-300 whitespace-nowrap">
              Comparison Text:
            </td>
            <td className="py-2 px-2">
              <TextInput state={comparisonTextState} />
            </td>
          </tr>
          <tr className="border-b border-gray-700/30 ">
            <td className="py-3 pr-8 pl-2 text-sm font-medium text-gray-300 whitespace-nowrap">
              Unique Text:
            </td>
            <td className="py-2 px-2">
              <TextInput state={uniqueState} placeholder="Enter text..." />
            </td>
          </tr>
          <tr className="border-b border-gray-700/30 ">
            <td className="py-3 pr-8 pl-2 text-sm font-medium text-gray-300 whitespace-nowrap">
              Trim Text:
            </td>
            <td className="py-2 px-2">
              <TextInput state={trimState} placeholder="Enter text..." />
            </td>
          </tr>
          <tr className="border-b border-gray-700/30  bg-gradient-to-r from-blue-500/5 to-purple-500/5">
            <td className="py-3 pr-8 pl-2 text-sm font-medium text-gray-300 whitespace-nowrap">
              Purchase Price:
            </td>
            <td className="py-2 px-2">
              <NumberInput state={priceB2bValueState} />
              <span className="ml-2 text-gray-400">
                {priceB2bState[0].currency}
              </span>
            </td>
          </tr>
          <tr className="border-b border-gray-700/30  bg-gradient-to-r from-blue-500/5 to-purple-500/5">
            <td className="py-3 pr-8 pl-2 text-sm font-medium text-gray-300 whitespace-nowrap">
              Customer Price:
            </td>
            <td className="py-2 px-2">
              <NumberInput state={priceB2cValueState} />
              <span className="ml-2 text-gray-400">
                {priceB2cState[0].currency}
              </span>
            </td>
          </tr>
          <tr className="border-b border-gray-700/30  bg-gradient-to-r from-blue-500/5 to-purple-500/5">
            <td className="py-3 pr-8 pl-2 text-sm font-medium text-gray-300 whitespace-nowrap">
              Market Price:
            </td>
            <td className="py-2 px-2">
              <NumberInput state={comparisonPriceValueState} />
              <span className="ml-2 text-gray-400">
                {comparisonPriceState[0].currency}
              </span>
            </td>
          </tr>
          <tr className="border-b border-gray-700/30">
            <td className="py-3 pr-8 pl-2 text-sm font-medium text-gray-300 whitespace-nowrap">
              Dealer Contact:
            </td>
            <td className="py-2 px-2">
              <div className="flex flex-row gap-2 w-50">
                <TextInput
                  state={dealerPhoneState}
                  placeholder="Phone number"
                />
                <TextInput
                  state={dealerEmailState}
                  placeholder="Email address"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function NumberInput({ state }: { state: State<number> }): React.ReactElement {
  return (
    <input
      type="number"
      value={state[0]}
      onChange={(e) => state[1](Number(e.target.value))}
      className="bg-gray-700/50 border border-gray-600 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200 w-32 md:w-40 lg:w-48"
    />
  );
}

function TextInput({
  state,
  placeholder,
}: {
  state: State<string>;
  placeholder?: string;
}): React.ReactElement {
  return (
    <input
      type="text"
      value={state[0]}
      onChange={(e) => state[1](e.target.value)}
      className="bg-gray-700/50 border border-gray-600 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200 w-64 md:w-80 lg:w-96 xl:w-[28rem]"
      placeholder={placeholder}
    />
  );
}
