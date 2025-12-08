import json
import os

file_path = r'c:\Users\MKT\desktop\teachtrack\G2\grade-2-kiswahili.json'

new_strands = [
    {
      "strandId": "7.0",
      "strandTitle": "SEBULENI",
      "subStrands": [
        {
          "subStrandId": "7.1",
          "subStrandTitle": "Kusikiliza na Kuzungumza: Maagizo (Maagizo ya hatua mbili)",
          "suggestedLessons": 3,
          "specificLearningOutcomes": [
            "kutambua maagizo mepesi ya hatua mbili yanapotolewa katika miktadha mbalimbali",
            "kutoa na kufuata maagizo mepesi ya hatua mbili yanayotumiwa katika miktadha mbalimbali",
            "kuchangamkia maagizo katika maisha ya kila siku"
          ],
          "suggestedLearningExperiences": [
            "kutambua maagizo ya hatua mbili",
            "kutazama video ya jinsi ya kutoa na kufuata maagizo mepesi ya hatua mbili kwa kifaa cha kidijitali kuhusu suala lengwa",
            "kushiriki katika kutoa na kufuata maagizo mepesi ya hatua mbili",
            "kufafanua umuhimu wa maagizo",
            "kuimba nyimbo na kukariri mashairi yanayohusu maagizo kuhusu suala lengwa"
          ],
          "keyInquiryQuestions": [
            "Kufuata maagizo kuna umuhimu gani?"
          ]
        },
        {
          "subStrandId": "7.2",
          "subStrandTitle": "Kusoma: Kusoma Kwa Ufahamu: Kifungu",
          "suggestedLessons": 3,
          "specificLearningOutcomes": [
            "kutambua msamiati kuhusu suala lengwa katika kifungu chepesi cha ufahamu",
            "kutabiri yatakayotokea katika kifungu chepesi cha ufahamu kwa kuzingatia picha",
            "kueleza ujumbe wa kifungu chepesi cha ufahamu",
            "kueleza mafunzo yanayotokana na kifungu chepesi cha ufahamu",
            "kuchangamkia kusoma vifungu vya ufahamu ili kuimarisha stadi ya kusoma"
          ],
          "suggestedLearningExperiences": [
            "kusoma kifungu chepesi cha maneno 43-46 na kutambua msamiati wa suala lengwa ( runinga, kochi, meza,radio ) akishirikiana na wenzake",
            "kutabiri kitakachotokea katika hadithi akizingatia picha kwenye kifungu akishirikiana na wenzake",
            "kutabiri ujumbe wa kifungu kwa kutazama picha kwenye kitabu, vifaa vya kidijitali au chati akishirikiana na wenzake kuhusu suala lengwa",
            "kueleza mafunzo yanayotokana na kifungu chepesi cha ufahamu akishirikiana na wenzake",
            "kuthibitisha utabiri wake kuhusu hadithi baada ya kuisoma",
            "kutumia msamiati wa suala lengwa ipasavyo katika mawasiliano"
          ],
          "keyInquiryQuestions": [
            "Je, tunawezaje kupata ujumbe katika ufahamu?"
          ]
        },
        {
          "subStrandId": "7.3",
          "subStrandTitle": "Kuandika: Uhariri: Vipengele katika Uhariri",
          "suggestedLessons": 3,
          "specificLearningOutcomes": [
            "kutambua vipengele vya kuhariri katika maandishi",
            "kuhariri maandishi yake baada ya kuyaandika",
            "kufurahia kuhariri maandishi baada ya kuyaandika ili kuimarisha mawasiliano"
          ],
          "suggestedLearningExperiences": [
            "kutambua vipengele vya kuhariri katika maandishi kwenye kitabu, chati au kifaa cha kidijitali akishirikiana na wenzake",
            "kuandika kifungu cha maneno mawili au sentensi fupi daftarini au kwenye kifaa cha kidijitali",
            "kujadiliana na wenzake kuhusu vipengele vya kuzingatia katika uhariri",
            "kuipitia kazi yake baada ya kuiandika ili kuhariri tahajia, nafasi baina ya sauti na maneno pamoja na viakifishi kuhusu suala lengwa",
            "kushirikiana na wenzake kuhariri kazi aliyoandika",
            "kumwonyesha mzazi au mlezi kifungu alichohariri ili ampe maoni yake"
          ],
          "keyInquiryQuestions": [
            "Je, kwa nini ni vizuri kusoma kazi uliyoandika na kuirekebisha?"
          ]
        },
        {
          "subStrandId": "7.4",
          "subStrandTitle": "Sarufi: Ukanusho wa nafsi ya pili, umoja na wingi",
          "suggestedLessons": 3,
          "specificLearningOutcomes": [
            "kutambua ukanusho wa nafsi ya pili, umoja na wingi katika sentensi",
            "kutumia ukanusho wa nafsi ya pili, umoja na wingi katika sentensi kwa usahihi",
            "kuchangamkia matumizi ya ukanusho wa nafsi ya pili, umoja na wingi, katika mawasiliano ya kila siku"
          ],
          "suggestedLearningExperiences": [
            "kutambua ukanusho wa nafsi ya pili, umoja na wingi, katika kadi maneno, mti maneno kuhusu suala lengwa",
            "kusikiliza kifungu au wimbo kuhusu ukanusho wa nafsi ya pili umoja na wingi kwenye kifaa cha kidijitali",
            "kushirikiana na wenzake katika kikundi kukanusha sentensi katika nafsi ya pili, umoja na wingi kuhusu suala lengwa, kwa mfano: wewe - ulisoma – wewe hukusoma",
            "kutunga sentensi zinazoashiria ukanusho wa nafsi ya pili umoja na wingi kuhusu suala lengwa kwa kusaidiwa na mwalimu",
            "kufanya zoezi la kujaza nafasi kwa kutumia nafsi ya pili, umoja na wingi, kwenye kifaa cha kidijitali",
            "kumsomea mzazi au mlezi sentensi alizokanusha katika nafsi ya pili, umoja na wingi ili ampe maoni"
          ],
          "keyInquiryQuestions": [
            "Ukanushaji wa sentensi katika umoja na wingi unahusu nini?"
          ]
        }
      ]
    },
    {
      "strandId": "8.0",
      "strandTitle": "USALAMA WANGU",
      "subStrands": [
        {
          "subStrandId": "8.1",
          "subStrandTitle": "Kusikiliza na Kuzungumza: Matamshi Bora Sauti: /sh/, /th/",
          "suggestedLessons": 3,
          "specificLearningOutcomes": [
            "kutambua maneno na sentensi zenye sauti lengwa",
            "kutamka maneno na sentensi za sauti lengwa kwa ufasaha",
            "kufurahia matamshi bora katika mawasiliano"
          ],
          "suggestedLearningExperiences": [
            "kutambua silabi za sauti lengwa katika matini mbalimbali kama vile kadi maneno, chati, mti maneno, au kifaa cha kidijitali",
            "kusikiliza maneno yenye silabi za sauti lengwa yakitamkwa na mwalimu, mgeni mwalikwa au kifaa cha kidijitali",
            "kutamka maneno aliyosikiliza pamoja na mwalimu na mwishowe kutamka akishirikiana na wenzake kuhusu suala lengwa",
            "kusikiliza kwa makini sentensi zenye sauti lengwa na zinazolenga suala lengwa zikitamkwa na mwalimu, mgeni mwalikwa au kifaa cha kidijitali na kuzitambua",
            "kusikiliza na kusimulia kifungu cha hadithi kuhusu suala lengwa (k.v usalama wangu na jinsi ya kudumisha usalama barabaran)",
            "kujirekodi akisoma hadithi zilizo na maneno na sentensi zenye sauti lengwa na kujisikiliza na wenzake ili kutathmini matamshi bora"
          ],
          "keyInquiryQuestions": [
            "Unajua kutamka maneno gani yenye sauti /sh/ na /th/?"
          ]
        },
        {
          "subStrandId": "8.2",
          "subStrandTitle": "Kusoma: Kusoma kwa ufasaha Sauti: /sh/ na /th/",
          "suggestedLessons": 3,
          "specificLearningOutcomes": [
            "kutambua sauti lengwa katika kifungu chepesi cha hadithi",
            "kusoma kifungu chepesi cha hadithi chenye sauti lengwa kwa kuzingatia matamshi bora",
            "kusoma kifungu chepesi cha hadithi chenye sauti lengwa kwa sauti inayosikika",
            "kusoma kifungu chepesi cha hadithi chenye sauti lengwa kwa kuzingatia kasi ifaayo",
            "kusoma kifungu chepesi cha hadithi chenye sauti lengwa kwa kuzingatia ishara zifaazo",
            "kuchangamkia kusoma kwa ufasaha ili kufanikisha mawasiliano"
          ],
          "suggestedLearningExperiences": [
            "kutambua sauti katika kifungu chepesi kuhusu suala lengwa akishirikiana na wenzake",
            "kusoma kifungu chepesi cha maneno chenye sauti lengwa kwa kuzingatia matamshi bora akishirikiana na wenzake kuhusu suala lengwa",
            "kusoma kifungu chepesi cha maneno chenye sauti lengwa kwa sauti inayosikika akishirikiana na wenzake kuhusu suala lengwa",
            "kusoma kifungu chepesi cha maneno chenye sauti lengwa kwa kuzingatia kasi ifaayo (maneno 42 kwa dakika na kwa kuizingatia viakifishi) akishirikiana na wenzake",
            "kusoma kifungu cha hadithi kutoka kwenye kitabu au kifaa cha kidijtali, akishirikiana na wenzake kuhusu usalama wangu na jinsi ya kudumisha usalama barabarani, akizingatia sauti inayosikika, matamshi bora, kasi na ishara zifaazo"
          ],
          "keyInquiryQuestions": [
            "Je, unajua kusoma maneno gani yenye sauti /sh/ na /th/?"
          ]
        },
        {
          "subStrandId": "8.3",
          "subStrandTitle": "Kuandika: Tahajia",
          "suggestedLessons": 3,
          "specificLearningOutcomes": [
            "kutambua tahajia sahihi za maneno katika sentensi",
            "kuandika sentensi akizingatia tahajia sahihi za maneno",
            "kufurahia kutumia tahajia sahihi katika maandishi"
          ],
          "suggestedLearningExperiences": [
            "kutambua tahajia sahihi za maneno katika sentensi kwenye kitabu au kifaa cha kidijitali",
            "kushirikiana na wenzake kujadili kuhusu tahajia sahihi ya maneno kwenye kifungu kitabuni au kifaa cha kidijitali",
            "kuandika sentensi kuhusu suala lengwa akizingatia tahajia sahihi za maneno",
            "kurekebisha sentensi akizingatia tahajia sahihi",
            "kujaza nafasi kwenye kifungu akizingatia tahajia sahihi kuhusu suala lengwa",
            "kumsomea mzazi au mlezi sentensi alizotunga akizingatia tahajia sahihi ili ampe maoni"
          ],
          "keyInquiryQuestions": [
            "Je, kwa nini ni vizuri kuandika maneno kwa kuzingatia tahajia ifaayo?"
          ]
        },
        {
          "subStrandId": "8.4",
          "subStrandTitle": "Sarufi: Matumizi ya huu na hii",
          "suggestedLessons": 3,
          "specificLearningOutcomes": [
            "kutambua huu na hii katika vifungu",
            "kutumia huu na hii kutajia vitu katika mazingira yake",
            "kuchangamkia matumizi ya huu na hii katika mawasiliano"
          ],
          "suggestedLearningExperiences": [
            "kutambua maneno huu na hii kwa kutumia nyenzo kama vile kadi maneno, mti maneno, chati au kifaa cha kidijitali",
            "kusoma vifungu vinavyojumuisha huu na hii",
            "kuonyesha vitu mbalimbali kuhusu suala lengwa kama vile miti na kuvitungia sentensi katika kikundi (k.m Mti huu – miti hii,)",
            "kukamilisha vifungu vyenye nafasi kwa kutumia huu na hii akishirikiana na wenzake",
            "kutunga sentensi akitumia huu na hii na zinazolenga suala lengwa",
            "kuandika vifungu akitumia huu na hii kutokana na picha"
          ],
          "keyInquiryQuestions": [
            "Ni vitu gani unavyoweza kurejelea kwa kutumia maneno huu na hii?"
          ]
        }
      ]
    },
    {
      "strandId": "9.0",
      "strandTitle": "HOSPITALINI",
      "subStrands": [
        {
          "subStrandId": "9.1",
          "subStrandTitle": "Kusikiliza na Kuzungumza: Mazungumzo ya papo kwa hapo",
          "suggestedLessons": 3,
          "specificLearningOutcomes": [
            "kuonyesha ufahamu wa suala linalozungumziwa",
            "kuzingatia matamshi bora anapozungumza",
            "kujieleza kwa ufasaha wakati wa kuzungumza, kutumia viziada lugha ipasavyo wakati wa kuzungumza",
            "kufurahia kutoa mazungumzo ya papo kwa hapo ili kujenga ufasaha wa kuzungumza"
          ],
          "suggestedLearningExperiences": [
            "kuonyesha ufahamu wa suala lengwa kwa kulieleza ipasavyo",
            "kusikiliza mgeni mwalikwa au mwalimu, wakizungumza",
            "kushirikiana na wenzake kusikiliza mazungumzo kwenye kifaa cha kidijitali kuhusu suala lengwa",
            "kuzungumza kwa kutamka ipasavyo sauti na maneno",
            "kujieleza kwa ufasaha anapozungumza kwa kutumia lugha inayoeleweka kuhusu suala lengwa, kutumia sauti ipasavyo kwa kuzingatia sauti inayosikika, kasi ya kuzungumza, toni pamoja na udhibiti wa upumuaji na viungo vya kutamka",
            "kuzungumza akitumia ipasavyo viziada lugha kama vile muktadha wa mazungumzo, ishara za uso, mikono mtuo, mkao wa mwili, utazamaji hadhira kuhusu suala lengwa",
            "kushirikiana na wenzake kuwasilisha mazungumzo ya papo kwa hapo wakiwa na wenzake, au wakati wa mazungumzo ya hadhara katika tamasha za muziki"
          ],
          "keyInquiryQuestions": [
            "Tunazingatia mambo gani tunapozungumza papo kwa hapo?"
          ]
        },
        {
          "subStrandId": "9.2",
          "subStrandTitle": "Kusoma: Kusoma kwa ufahamu Kusoma kifungu",
          "suggestedLessons": 3,
          "specificLearningOutcomes": [
            "kutambua msamiati kuhusu suala lengwa katika kifungu chepesi cha ufahamu",
            "kutabiri yatakayotokea katika kifungu chepesi cha ufahamu kwa kuzingatia picha",
            "kueleza ujumbe wa kifungu chepesi cha ufahamu",
            "kueleza mafunzo yanayotokana na kifungu chepesi cha ufahamu",
            "kuchangamkia kusoma vifungu vya ufahamu ili kuimarisha stadi ya kusoma"
          ],
          "suggestedLearningExperiences": [
            "kusoma kifungu chepesi cha maneno 47 - 50 na kutambua msamiati wa suala lengwa (dawa, sindano, kitanda) akishirikiana na wenzake",
            "kutabiri kitakachotokea katika hadithi akizingatia picha kwenye kifungu akiwa peke yake, au na wenzake",
            "kutabiri ujumbe wa kifungu kwa kutazama picha kwenye kitabu, vifaa vya kidijitali au chati akishirikiana na wenzake",
            "kueleza mafunzo yanayotokana na kifungu chepesi cha hadithi kuhusu suala lengwa akishirikiana na wenzake",
            "kuthibitisha utabiri wake kuhusu hadithi baada ya kuisoma",
            "kutumia msamiati wa suala lengwa ipasavyo katika mawasiliano"
          ],
          "keyInquiryQuestions": [
            "Je, ukitaka kupata ujumbe kwenye kifungu unazingatia nini?"
          ]
        },
        {
          "subStrandId": "9.3",
          "subStrandTitle": "Kuandika: Kuandika Kifungu",
          "suggestedLessons": 3,
          "specificLearningOutcomes": [
            "kutambua suala la kuandikia kifungu",
            "kuandika kifungu kifupi kutokana na mazingira yake",
            "kufurahia kuandika kifungu ili kujieleza"
          ],
          "suggestedLearningExperiences": [
            "kutambua suala la kuandikia kwa kulijadiliana na wenzake darasani",
            "kutazama picha kuhusu suala lengwa ili kupata habari za kuandikia",
            "kuwaelekeza wenzake kuhusu atakachoandikia akiwa na wenzake",
            "kusikiliza wenzake wakieleza kuhusu jambo au suala watakaloandikia kuhusu suala lengwa",
            "kuandika kifungu kifupi cha sentensi moja au zaidi chenye maelezo yanayoeleweka kuhusu suala lengwa",
            "kuwawasilishia wenzake kifungu alichoandika ili wakitolee maoni",
            "kumsomea mzazi au mlezi kifungu alichokiandika na kumweleza suala aliloandikia ili ampe maoni"
          ],
          "keyInquiryQuestions": [
            "Je, unaongozwa na mambo gani unapotaka kuandika kifungu?"
          ]
        },
        {
          "subStrandId": "9.4",
          "subStrandTitle": "Sarufi: Matumizi ya Vizuri na Vibaya, Polepole na Haraka",
          "suggestedLessons": 3,
          "specificLearningOutcomes": [
            "kutambua matumizi yafaayo ya vizuri na vibaya, polepole na haraka katika kifungu",
            "kutumia vizuri na vibaya, polepole na haraka katika sentensi",
            "kuchangamkia matumizi ya vizuri na vibaya katika kuimarisha mawasiliano"
          ],
          "suggestedLearningExperiences": [
            "kutambua matumizi ya vizuri na vibaya, polepole na haraka katika nyenzo kama vile kadi za majina, kapu maneno, mti maneno au chati au kwenye kifaa cha kidijitali",
            "kuigiza vitendo mbalimbali kwa kutumia vizuri na vibaya, polepole na haraka",
            "kuandika sentensi zinazojumuisha vizuri na vibaya, polepole na haraka",
            "kujaza nafasi kwa kutumia vizuri na vibaya, polepole na haraka akizingatia suala lengwa kwa kusaidiwa na mwalimu"
          ],
          "keyInquiryQuestions": [
            "Unatumia maneno yapi kuelezea jinsi watu wanavyofanya vitendo?"
          ]
        }
      ]
    }
]

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Append new strands
data['strands'].extend(new_strands)

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Successfully appended Strands 7.0, 8.0, and 9.0 to grade-2-kiswahili.json")
