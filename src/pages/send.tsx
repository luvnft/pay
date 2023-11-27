import {
  MediaRenderer,
  NATIVE_TOKEN_ADDRESS,
  useAddress,
  useBalance,
  useSDK,
} from "@thirdweb-dev/react";
import WalletConnectSection from "@/components/WalletConnectSection";
import AppContainer from "@/components/AppContainer";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { BookUser, ChevronLeft, Sprout } from "lucide-react";
import { Input } from "@/components/ui/input";
import formatNumber from "@/lib/numberFormatter";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { CHAIN } from "@/const/config";
import Link from "next/link";
import { TransactionReceipt } from "@ethersproject/providers";
import { useRouter } from "next/router";
import { useDebounce } from "use-debounce";
import { Skeleton } from "@/components/ui/skeleton";
import { Profile, useSearchProfiles } from "@lens-protocol/react-web";

const formPhases = [
  {
    title: "Who are you paying?",
    description: "Who's the lucky recipient?",
    options: [
      {
        key: "address",
        title: "Wallet Address",
        icon: <BookUser />,
      },
      {
        key: "lens",
        title: "Lens Profile",
        icon: <Sprout />,
      },
    ],
  },
  {
    title: "How much are you paying?",
    description: "How much do you want to send?",
  },
  {
    title: "Ready to send?",
    description: "Review your payment and confirm.",
  },
  {
    title: "Sending Payment",
    description: "Please wait while we send your payment.",
  },
];

export default function SendPage() {
  const address = useAddress();
  const router = useRouter();

  // Phase 0 State
  const [enterAddressOption, setEnterAddressOption] = useState<
    null | "address" | "lens"
  >(null);
  const [addressToPay, setAddressToPay] = useState<string>("");
  const [addressToPayError, setAddressToPayError] = useState<string>("");

  const [lensProfileToPay, setLensProfileToPay] = useState<string>("");
  const [debouncedLensProfile] = useDebounce(lensProfileToPay, 1000);
  const { data: profiles, loading: loadingProfiles } = useSearchProfiles({
    query: debouncedLensProfile,
  });
  const [selectedLensProfile, setSelectedLensProfile] = useState<Profile>();

  // Phase 1 State
  const [amountToPay, setAmountToPay] = useState<string>("");
  const [amountToPayError, setAmountToPayError] = useState<string>("");

  // Phase 3 State
  const [paymentTransaction, setPaymentTransaction] =
    useState<TransactionReceipt>();
  const [isSendingPayment, setIsSendingPayment] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<any>();

  const { data: nativeTokenBalance, isLoading: loadingNativeTokenBalance } =
    useBalance(NATIVE_TOKEN_ADDRESS);

  const [formPhase, setFormPhase] = useState<number>(0);

  const sdk = useSDK();
  async function sendPayment() {
    if (!sdk || !addressToPay || !amountToPay) {
      return;
    }

    try {
      setIsSendingPayment(true);
      const tx = await sdk.wallet.transfer(
        addressToPay,
        amountToPay,
        NATIVE_TOKEN_ADDRESS
      );
      setPaymentSuccess(true);
      setPaymentTransaction(tx.receipt);
      console.log(tx);
    } catch (error) {
      setPaymentError(error);
      console.error(error);
    } finally {
      setIsSendingPayment(false);
    }
  }

  function validateAddress(addressToSend: string): string | true {
    if (!addressToSend) {
      return "Please enter an address";
    }

    if (addressToSend === address) {
      return "You can't pay yourself";
    }

    if (addressToSend.length !== 42) {
      return "Invalid address";
    }

    if (!addressToSend.startsWith("0x")) {
      return "Invalid address";
    }

    return true;
  }

  if (!address) {
    return (
      <AppContainer>
        <div className="container max-w-screen-sm w-[560px] flex flex-col items-center lg:items-start h-screen px-3 py-8 lg:px-8 lg:mt-48">
          <WalletConnectSection />
        </div>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <div className="container max-w-[720px] flex flex-col items-center lg:items-start h-screen max-h-[85%] px-3 py-8 lg:px-8 lg:mt-48 gap-4 lg:gap-0">
        <h1 className="scroll-m-20 text-4xl lg:text-6xl font-extrabold tracking-tight lg:mt-4 text-center">
          Pay Someone
        </h1>
        <Separator className="w-5/6  mt-4 lg:mt-8 mb-8" />

        <div className="flex flex-col-reverse lg:flex-row gap-8 lg:gap-2 items-center justify-center lg:w-full lg:justify-between">
          <h2 className="text-xl lg:text-2xl font-semibold text-center lg:text-start lg:mb-4">
            {formPhases[formPhase].title}
          </h2>

          {formPhase !== 3 && (
            <Button
              variant="outline"
              onClick={() => {
                if (formPhase === 0 && !enterAddressOption) {
                  router.push(`/dashboard`);
                }

                if (formPhase === 0 && enterAddressOption) {
                  setEnterAddressOption(null);
                }

                if (formPhase === 1) {
                  setEnterAddressOption(null);
                }

                if (formPhase > 0) {
                  setFormPhase(formPhase - 1);
                }
              }}
              className="h-auto rounded-full lg:self-start"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Phase 0: Enter Address to send funds to */}
        {formPhase === 0 && enterAddressOption === null && (
          <>
            <div className="w-full flex flex-row justify-center items-center gap-2 lg:gap-4 mb-8">
              {/* @ts-expect-error: Also fine - formPhases[0].options can only be undefined if we change the object which we don't */}
              {formPhases[0].options.map((option, index) => (
                <Card
                  key={option.key}
                  onClick={() => {
                    setAddressToPay("");
                    // @ts-expect-error: This is fine unless we change the object it will always be a key.
                    setEnterAddressOption(option.key);
                  }}
                  className="w-full flex flex-col items-center justify-start gap-2 py-2 hover:shadow-lg transition-shadow duration-200 ease-in-out cursor-pointer"
                >
                  {option.icon}
                  <p className="text-sm lg:text-md font-semibold gap-2">
                    {option.title}
                  </p>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Phase 0 Option A: Wallet Address */}
        {formPhase === 0 && enterAddressOption === "address" && (
          <div className="w-5/6 flex flex-col items-center justify-center">
            <div className="w-full flex flex-row justify-end items-start gap-2">
              <div className="w-full flex flex-col">
                <Input
                  type="text"
                  placeholder="Wallet Address"
                  className={`w-full ${
                    addressToPayError ? "border-red-500" : ""
                  }`}
                  value={addressToPay}
                  onChange={(e) => {
                    setAddressToPay(e.target.value);
                  }}
                />
                {addressToPayError && (
                  <p className="text-sm text-red-500 ml-2 mt-1">
                    {addressToPayError}
                  </p>
                )}
              </div>
              <Button
                onClick={() => {
                  const validation = validateAddress(addressToPay);
                  if (validation !== true) {
                    setAddressToPayError(validation);
                    return;
                  }

                  setAddressToPayError("");
                  setFormPhase(formPhase + 1);
                }}
                className="w-1/4"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Phase 0 Option B: Lens Profile */}
        {formPhase === 0 && enterAddressOption === "lens" && (
          <>
            <div className="w-5/6 flex flex-col items-center justify-center">
              <div className="w-full flex flex-row justify-end items-start gap-2">
                <div className="w-full flex flex-col">
                  <Input
                    type="text"
                    placeholder="Enter a Lens handle, e.g. jarrodwatts.lens"
                    className={`w-full`}
                    value={lensProfileToPay}
                    onChange={(e) => {
                      setLensProfileToPay(e.target.value);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="w-full flex flex-col mt-8">
              <h4 className="scroll-m-20 text-lg font-semibold tracking-tight">
                People
              </h4>

              <Separator />

              {debouncedLensProfile &&
                debouncedLensProfile === lensProfileToPay && (
                  <div className="w-full flex flex-col justify-center items-center gap-2 mt-4">
                    <div className="w-full flex flex-col gap-2">
                      {profiles?.map((profile) => (
                        <Card
                          onClick={() => {
                            setAddressToPay(profile.ownedBy.address);
                            setSelectedLensProfile(profile);
                            setFormPhase(formPhase + 1);
                          }}
                          key={profile.id}
                          className="w-full flex flex-row items-center justify-start gap-2 py-2 px-3 hover:shadow-lg transition-shadow duration-200 ease-in-out cursor-pointer"
                        >
                          <MediaRenderer
                            src={
                              // @ts-expect-error: IDK why it doesn't like this
                              profile?.metadata?.picture?.optimized?.uri ||
                              `/profile.png`
                            }
                            style={{
                              width: 32,
                              height: 32,
                            }}
                            alt="Lens Profile Avatar"
                            className="rounded-full"
                          />

                          <div className="flex flex-col items-start justify-center">
                            <p className="text-sm lg:text-md font-semibold">
                              {profile.handle?.suggestedFormatted.localName}
                            </p>
                            <p className="text-xs lg:text-sm text-muted-foreground">
                              {profile.ownedBy.address}
                            </p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

              {debouncedLensProfile !== lensProfileToPay && (
                <div className="w-full flex flex-col justify-center items-center gap-2 mt-4">
                  {Array.from(Array(5).keys()).map((index) => (
                    <Skeleton className="w-full h-12" key={index} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Phase 1: Enter Amount to Send */}
        {formPhase === 1 && (
          <>
            <div className="w-5/6 flex flex-col items-center justify-center">
              <div className="w-full flex flex-row justify-end items-start gap-2">
                <div className="w-full flex flex-col items-center justify-center">
                  <div className="w-full flex flex-col">
                    <Input
                      value={amountToPay}
                      onChange={(e) => {
                        if (e.target.value.startsWith("-")) {
                          return;
                        }

                        if (e.target.value.length > 18) {
                          return;
                        }

                        setAmountToPay(e.target.value);
                      }}
                      className={`w-full ${
                        amountToPayError ? "border-red-500" : ""
                      }`}
                      type="number"
                      placeholder="Amount"
                    />
                    {amountToPayError && (
                      <p className="text-sm text-red-500 ml-2 mt-1">
                        {amountToPayError}
                      </p>
                    )}
                  </div>

                  <div className="w-full flex flex-row justify-start items-center gap-2 mt-2 ml-2">
                    <p className="text-sm font-semibold gap-2">Your balance:</p>
                    <p className="text-sm">
                      {loadingNativeTokenBalance && "Loading..."}

                      {!loadingNativeTokenBalance &&
                        nativeTokenBalance &&
                        formatNumber(Number(nativeTokenBalance.displayValue))}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    if (!amountToPay) {
                      setAmountToPayError("Please enter an amount");
                      return;
                    }

                    if (Number(amountToPay) === 0) {
                      setAmountToPayError("Please enter an amount");
                      return;
                    }

                    if (
                      nativeTokenBalance &&
                      Number(amountToPay) >
                        Number(nativeTokenBalance.displayValue)
                    ) {
                      setAmountToPayError("Insufficient funds");
                      return;
                    }

                    if (Number(amountToPay) < 0) {
                      setAmountToPayError("Invalid amount");
                      return;
                    }

                    setAmountToPayError("");
                    setFormPhase(formPhase + 1);
                  }}
                  className="w-1/4"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Phase 2: Confirm Payment */}
        {formPhase === 2 && (
          <>
            <div className="w-full flex flex-col justify-end items-start gap-2">
              <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-start rounded-xl shadow-xl h-auto w-full backdrop-blur-xl backdrop-filter bg-white bg-opacity-5 px-8 py-8 mb-4">
                <Image
                  src={`/wallaby-money.png`}
                  width={128}
                  height={128}
                  quality={100}
                  alt="Wallaby"
                />

                <div className="flex flex-col items-start justify-center ml-4 gap-1">
                  <p className="text-xs lg:text-sm text-muted-foreground">
                    You are sending
                  </p>

                  <p className="text-md lg:text-lg font-semibold">
                    {amountToPay} {CHAIN.nativeCurrency.symbol}
                  </p>

                  <p className="text-xs lg:text-sm text-muted-foreground">to</p>
                  <p className="text-xs lg:text-md">{addressToPay}</p>

                  {selectedLensProfile && (
                    <>
                      <p className="text-xs lg:text-sm text-muted-foreground">
                        the owner of Lens profile
                      </p>
                      <p className="text-xs lg:text-md">
                        {
                          selectedLensProfile?.handle?.suggestedFormatted
                            .localName
                        }
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="w-full flex flex-row justify-end items-start gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAmountToPay("");
                    setAddressToPay("");
                    setFormPhase(0);
                  }}
                  className="w-1/3"
                >
                  Cancel
                </Button>

                <Button
                  onClick={() => {
                    sendPayment();
                    setFormPhase(formPhase + 1);
                  }}
                  className="w-1/3"
                >
                  Send
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Phase 3: Payment Sending */}
        {formPhase === 3 && (
          <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-start rounded-xl shadow-xl h-auto w-full backdrop-blur-xl backdrop-filter bg-white bg-opacity-5 px-8 py-8 mb-4">
            <div className="w-full flex flex-col items-center gap-2">
              {isSendingPayment && (
                <>
                  <Image
                    src={`/lol.gif`}
                    fill
                    alt="Flying effect gif"
                    className="opacity-50 rounded-xl"
                  />

                  <Image
                    src={`/wallaby-flying.png`}
                    width={300}
                    height={300}
                    quality={100}
                    alt="Wallaby Cape"
                    className="z-10"
                  />
                </>
              )}

              {paymentSuccess && (
                <>
                  <Image
                    src={`/wallaby-success.png`}
                    width={300}
                    height={300}
                    quality={100}
                    alt="Wallaby Success"
                    className="z-10"
                  />

                  <p className="text-md lg:text-lg font-semibold">
                    Payment Successful
                  </p>

                  <Link
                    className="text-sm lg:text-md text-blue-500 bold underline"
                    href={`${CHAIN.explorers[0].url}/tx/${paymentTransaction?.transactionHash}`}
                    target="_blank"
                  >
                    View Transaction Details
                  </Link>

                  <Button
                    variant="outline"
                    onClick={() => router.push(`/dashboard`)}
                    className="w-full"
                  >
                    Go Home
                  </Button>
                </>
              )}

              {paymentError && (
                <>
                  <Image
                    src={`/wallaby-failure.png`}
                    width={300}
                    height={300}
                    quality={100}
                    alt="Wallaby Error"
                    className="z-10"
                  />

                  <p className="text-md lg:text-lg font-semibold">
                    Payment Failed!
                  </p>

                  <p className="text-sm lg:text-md text-red-500">
                    Please try again later.
                  </p>

                  <div className="w-full flex flex-row justify-center items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/dashboard`)}
                      className="w-1/3"
                    >
                      Go Home
                    </Button>

                    <Button
                      onClick={() => {
                        setPaymentError(undefined);
                        sendPayment();
                      }}
                      className="w-1/3"
                    >
                      Try Again
                    </Button>
                  </div>

                  <Separator className="my-2" />

                  <p className="text-sm font-semibold">
                    The full error message can be found below:
                  </p>

                  <p className="text-sm lg:text-md text-red-500 break-all max-w-full">
                    {paymentError?.message}
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AppContainer>
  );
}
