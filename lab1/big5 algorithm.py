questions = [
   
    ("I enjoy trying new games.", "O", False),
    ("I prefer playing familiar games over new ones.", "O", True),

    ("I always complete quests in order.", "C", False),
    ("I often leave quests unfinished.", "C", True),

    ("I enjoy playing games with others.", "E", False),
    ("I prefer to play solo games.", "E", True),

    ("I usually support my teammates when they need help.", "A", False),
    ("I often argue with opponents during gameplay.", "A", True),

    ("I often feel worried or stressed when playing games.", "N", False),
    ("I remain calm under pressure.", "N", True)
]

scores = {
    "O": [],
    "C": [],
    "E": [],
    "A": [],
    "N": []
}

print("BIG FIVE PERSONALITY TEST")
print("-------------------------")
print("1 = Strongly Disagree")
print("2 = Disagree")
print("3 = Neutral")
print("4 = Agree")
print("5 = Strongly Agree\n")


for question, trait, reverse in questions:

    while True:
       
        answer = int(input(question + " (1-5): "))

        if 1 <= answer <= 5:
            break

        print("Please enter a number from 1 to 5.")

        if answer != 1 and answer != 2 and answer != 3 and answer != 4 and answer != 5:
            print("Invalid input. Please enter a number from 1 to 5.")


    if reverse:
        answer = 6 - answer

    scores[trait].append(answer)



results = {}

for trait in scores:
    results[trait] = sum(scores[trait]) / len(scores[trait])


trait_names = {
    "O": "Openness",
    "C": "Conscientiousness",
    "E": "Extraversion",
    "A": "Agreeableness",
    "N": "Neuroticism"
}


print("\nYOUR RESULTS")
print("------------")

for trait in results:

    # Convert 1-5 score to 0-100
    percentage = (results[trait] - 1) / 4 * 100

    print(f"{trait_names[trait]}: {percentage:.1f}%")