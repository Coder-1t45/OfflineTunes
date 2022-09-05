

def extract_perfix(ns:str):
    def isfloat(element):
        try:
            float(element)
        except ValueError:
            return False
        return True
    number = ''
    temp = ns[0]
    i = 1
    while isfloat(temp) or temp.endswith('.'):
        number = temp
        i += 1
        temp = ns[0:i]
    number=number.replace(' ', '')
    return float(number), ns[i-1:]

print(extract_perfix('1.234 Imdb/s'))